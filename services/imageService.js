const { HfInference } = require('@huggingface/inference');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class ImageService {
    constructor() {
        // Cloudflare Workers AI (primary image provider)
        this.cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        this.cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
        this.cloudflareModel = '@cf/black-forest-labs/flux-1-schnell';

        // Initialize Hugging Face client
        this.hfClient = null;
        if (process.env.HUGGINGFACE_API_KEY) {
            try {
                this.hfClient = new HfInference(process.env.HUGGINGFACE_API_KEY);
                console.log('🎨 Hugging Face Image Service initialized');
            } catch (error) {
                console.warn('⚠️  Hugging Face initialization failed:', error.message);
            }
        }

        // Stable Diffusion local API configuration
        this.sdApiUrl = process.env.SD_API_URL || 'http://127.0.0.1:7860';
        this.sdEnabled = process.env.SD_ENABLED !== 'false'; // Enabled by default
        
        // Default models
        this.hfModel = process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";
        
        console.log(`🖼️  Image Service initialized:`);
        console.log(`   ✓ Primary: Hugging Face ${this.hfClient ? '✅' : '❌'}`);
        console.log(`   ✓ Fallback: Stable Diffusion (${this.sdApiUrl}) ${this.sdEnabled ? '✅' : '⚠️  Disabled'}`);
    }

    /**
     * Generate image with automatic fallback
     * Tries Hugging Face first, falls back to Stable Diffusion if it fails
     */
    async generateImage(prompt, options = {}) {
        const startTime = Date.now();
        let lastError = null;

        // Try Cloudflare first because it was verified in this environment.
        if (this.cloudflareAccountId && this.cloudflareApiToken) {
            try {
                console.log('🎨 Attempting image generation with Cloudflare Workers AI...');
                const result = await this.generateWithCloudflare(prompt, options);
                return {
                    ...result,
                    provider: 'cloudflare',
                    model: this.cloudflareModel,
                    processingTime: Date.now() - startTime
                };
            } catch (error) {
                console.error('❌ Cloudflare image generation failed:', error.message);
                lastError = error;
            }
        } else {
            console.log('⚠️ Cloudflare credentials are not configured');
        }

        // Keep existing providers as fallbacks.
        if (this.hfClient) {
            try {
                console.log('Trying Hugging Face fallback...');
                const result = await this.generateWithHuggingFace(prompt, options);
                return {
                    ...result,
                    provider: 'huggingface',
                    model: this.hfModel,
                    processingTime: Date.now() - startTime
                };
            } catch (error) {
                console.error('❌ Hugging Face fallback failed:', error.message);
                lastError = error;
            }
        }

        if (this.sdEnabled) {
            try {
                console.log('Trying Stable Diffusion fallback...');
                const result = await this.generateWithStableDiffusion(prompt, options);
                return {
                    ...result,
                    provider: 'stable-diffusion',
                    model: 'stable-diffusion-local',
                    processingTime: Date.now() - startTime
                };
            } catch (error) {
                console.error('❌ Stable Diffusion fallback failed:', error.message);
                lastError = error;
            }
        }

        throw new Error(
            `Image generation failed with all providers. Last error: ${lastError?.message || 'No provider configured'}.`
        );
    }

    /**
     * Generate an image with Cloudflare Workers AI.
     */
    async generateWithCloudflare(prompt, options = {}) {
        const url =
            `https://api.cloudflare.com/client/v4/accounts/` +
            `${this.cloudflareAccountId}/ai/run/${this.cloudflareModel}`;

        const response = await axios.post(
            url,
            {
                prompt,
                steps: options.steps || 4
            },
            {
                timeout: 120000,
                headers: {
                    Authorization: `Bearer ${this.cloudflareApiToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const image = response.data?.result?.image;
        if (!image || typeof image !== 'string') {
            throw new Error('Cloudflare returned no image data');
        }

        const base64 = image.replace(/^data:image\/[^;]+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');

        if (!buffer.length) {
            throw new Error('Cloudflare returned an empty image');
        }

        return {
            buffer,
            format: 'png',
            metadata: { prompt, model: this.cloudflareModel }
        };
    }

    /**
     * Generate image using Hugging Face API
     */
    async generateWithHuggingFace(prompt, options = {}) {
        const imageBlob = await this.hfClient.textToImage({
            model: options.model || this.hfModel,
            inputs: prompt
        });

        const buffer = Buffer.from(await imageBlob.arrayBuffer());
        
        return {
            buffer,
            format: 'png',
            metadata: {
                prompt,
                model: options.model || this.hfModel
            }
        };
    }

    /**
     * Generate image using Stable Diffusion local API
     */
    async generateWithStableDiffusion(prompt, options = {}) {
        // First, check if SD API is accessible
        await this.checkStableDiffusionHealth();

        const payload = {
            prompt: prompt,
            negative_prompt: options.negativePrompt || "",
            steps: options.steps || 20,
            width: options.width || 512,
            height: options.height || 512,
            cfg_scale: options.cfgScale || 7,
            sampler_name: options.sampler || "Euler a",
            seed: options.seed || -1
        };

        console.log('📤 Sending request to Stable Diffusion API...');
        
        const response = await axios.post(
            `${this.sdApiUrl}/sdapi/v1/txt2img`,
            payload,
            {
                timeout: 120000, // 2 minutes timeout
                headers: { 'Content-Type': 'application/json' }
            }
        );

        if (!response.data || !response.data.images || response.data.images.length === 0) {
            throw new Error('Stable Diffusion API returned no images');
        }

        // SD returns base64 encoded image
        const imageBase64 = response.data.images[0];
        const buffer = Buffer.from(imageBase64, 'base64');

        return {
            buffer,
            format: 'png',
            metadata: {
                prompt,
                parameters: response.data.parameters || payload,
                info: response.data.info
            }
        };
    }

    /**
     * Check if Stable Diffusion API is running and accessible
     */
    async checkStableDiffusionHealth() {
        try {
            const response = await axios.get(`${this.sdApiUrl}/sdapi/v1/sd-models`, {
                timeout: 5000
            });
            return response.status === 200;
        } catch (error) {
            throw new Error(
                `Stable Diffusion API is not accessible at ${this.sdApiUrl}. ` +
                `Make sure Stable Diffusion WebUI is running with --api flag. ` +
                `Error: ${error.message}`
            );
        }
    }

    /**
     * Save generated image to user's directory
     */
    async saveImage(buffer, userId, filename = null) {
        const userImageDir = path.resolve(__dirname, `../uploads/images/user-${userId}`);
        
        if (!fs.existsSync(userImageDir)) {
            fs.mkdirSync(userImageDir, { recursive: true });
        }

        const imageFilename = filename || `${Date.now()}-generated.png`;
        const filepath = path.join(userImageDir, imageFilename);
        
        fs.writeFileSync(filepath, buffer);
        
        console.log(`💾 Image saved: ${filepath}`);
        
        return {
            filename: imageFilename,
            filepath,
            url: `/uploads/images/user-${userId}/${imageFilename}`
        };
    }

    /**
     * Get service status for diagnostics
     */
    getStatus() {
        return {
            cloudflare: {
                available: !!(this.cloudflareAccountId && this.cloudflareApiToken),
                model: this.cloudflareModel
            },
            huggingface: {
                available: !!this.hfClient,
                model: this.hfModel
            },
            stableDiffusion: {
                enabled: this.sdEnabled,
                url: this.sdApiUrl
            }
        };
    }
}

module.exports = new ImageService();
