const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Search DuckDuckGo Lite for web results
 * @param {string} query - The search query
 * @param {number} maxResults - Maximum number of results to return (default: 10)
 * @returns {Promise<Array>} Array of search results with title, link, and snippet
 */
async function searchDuckDuckGo(query, maxResults = 10) {
    try {
        // Use the lite HTML interface which is stable and compact
        const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0'
            },
            timeout: 15000 // Increased timeout for better reliability
        });

        const $ = cheerio.load(response.data);
        const results = [];

        // DuckDuckGo Lite uses a table structure with result-link class
        $('a.result-link').each((i, el) => {
            if (results.length >= maxResults) return false; // Stop when we have enough results

            const title = $(el).text().trim();
            let link = $(el).attr('href') || '';
            
            // Extract the actual URL from DuckDuckGo's redirect link
            if (link && link.includes('uddg=')) {
                try {
                    const urlParams = new URLSearchParams(link.split('?')[1]);
                    link = decodeURIComponent(urlParams.get('uddg') || link);
                } catch (e) {
                    // Keep original link if parsing fails
                }
            }

            // Navigate to snippet: link is in TR, next TR has snippet
            let snippet = '';
            const parentTr = $(el).closest('tr');
            const snippetTr = parentTr.next();
            const snippetEl = snippetTr.find('td.result-snippet');
            if (snippetEl.length) {
                snippet = snippetEl.text().trim();
            }

            if (title && link) {
                results.push({
                    title,
                    link,
                    snippet: snippet || 'No description available'
                });
            }
        });

        console.log(`✅ DuckDuckGo search completed: ${results.length} results for "${query}"`);
        return results.slice(0, maxResults);

    } catch (error) {
        console.error('❌ DuckDuckGo search error:', error.message);
        
        // Return a helpful error result
        return [{
            title: 'Search Error',
            link: '',
            snippet: `Unable to fetch search results: ${error.message}. Please try again.`
        }];
    }
}

/**
 * Search for images using Wikimedia Commons (free, comprehensive image library)
 * Falls back to direct image URLs from popular image services
 * @param {string} query - The search query
 * @param {number} maxResults - Maximum number of images to return (default: 6)
 * @returns {Promise<Array>} Array of image results with url, title, source
 */
async function searchDuckDuckGoImages(query, maxResults = 6) {
    try {
        const images = [];
        
        // Try Wikimedia Commons API (free, no auth required, CC licensed images)
        try {
            const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=${maxResults}&format=json`;
            
            const wikimediaResponse = await axios.get(wikiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                },
                timeout: 10000
            });

            if (wikimediaResponse.data && wikimediaResponse.data.query && wikimediaResponse.data.query.search) {
                const searchResults = wikimediaResponse.data.query.search;
                
                // Get image details for each result
                for (const result of searchResults.slice(0, maxResults)) {
                    try {
                        // Get file info
                        const fileUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(result.title)}&prop=imageinfo&iiprop=url|width|height|extmetadata&format=json`;
                        const fileResponse = await axios.get(fileUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                            },
                            timeout: 8000
                        });

                        const pages = fileResponse.data.query.pages;
                        const page = Object.values(pages)[0];
                        
                        if (page.imageinfo && page.imageinfo[0]) {
                            const imgInfo = page.imageinfo[0];
                            const desc = page.imageinfo[0].extmetadata?.ImageDescription?.value || result.title;
                            
                            images.push({
                                url: imgInfo.url,
                                thumbnail: imgInfo.thumburl || imgInfo.url,
                                title: result.title.replace(/_/g, ' ').replace(/File:/, '').replace(/\.(jpg|jpeg|png|gif|webp)$/i, ''),
                                source: 'Wikimedia Commons',
                                license: 'CC Licensed',
                                width: imgInfo.width || 400,
                                height: imgInfo.height || 300,
                                description: desc.substring(0, 100)
                            });
                            
                            if (images.length >= maxResults) break;
                        }
                    } catch (fileError) {
                        console.warn(`⚠️ Could not fetch file info for ${result.title}:`, fileError.message);
                    }

                    if (images.length >= maxResults) break;
                }

                if (images.length > 0) {
                    console.log(`✅ Image search completed: ${images.length} images from Wikimedia Commons for "${query}"`);
                    return images;
                }
            }
        } catch (wikimediaError) {
            console.warn('⚠️ Wikimedia search failed:', wikimediaError.message);
        }

        // Fallback: Generate image results from multiple free image sources
        console.log('🔄 Using fallback - providing links to free image libraries');
        
        const imageServices = [
            {
                name: 'Unsplash',
                url: `https://unsplash.com/s/photos/${encodeURIComponent(query)}`,
                color: '2ea043'
            },
            {
                name: 'Pexels',
                url: `https://www.pexels.com/search/${encodeURIComponent(query)}/`,
                color: '05a081'
            },
            {
                name: 'Pixabay',
                url: `https://pixabay.com/images/search/${encodeURIComponent(query)}/`,
                color: '110066'
            },
            {
                name: 'Wikimedia Commons',
                url: `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(query)}&title=Special:MediaSearch&type=image`,
                color: '3366cc'
            },
            {
                name: 'Flickr',
                url: `https://www.flickr.com/search/?text=${encodeURIComponent(query)}&license=2%2C3%2C4%2C5%2C6%2C9`,
                color: 'ff0084'
            },
            {
                name: 'OpenStreetMap',
                url: `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`,
                color: '2B5F7F'
            }
        ];

        // Create result for each service (up to maxResults)
        imageServices.slice(0, maxResults).forEach((service, idx) => {
            images.push({
                url: service.url,
                thumbnail: `https://placehold.co/300x200/${service.color}/ffffff?text=${encodeURIComponent(service.name + ' Images')}`,
                title: `${query} - View on ${service.name}`,
                source: service.name,
                searchUrl: service.url,
                clickable: true,
                width: 300,
                height: 200
            });
        });
        
        return images;

    } catch (error) {
        console.error('❌ Image search error:', error.message);
        return [];
    }
}

/**
 * Extract domain from URL
 * @param {string} url - Full URL
 * @returns {string} Domain name
 */
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch (e) {
        return 'unknown';
    }
}

/**
 * Search multiple sources for better results (future enhancement)
 * @param {string} query - The search query
 * @returns {Promise<Array>} Combined search results
 */
async function multiSourceSearch(query) {
    // Currently only DuckDuckGo, but can be extended to other sources
    const results = await searchDuckDuckGo(query);
    return results;
}

module.exports = {
    searchDuckDuckGo,
    searchDuckDuckGoImages,
    multiSourceSearch
};
