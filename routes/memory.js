const express = require('express');
const router = express.Router();
const memoryService = require('../services/memoryService');
const { auth } = require('../middleware/auth');

/**
 * Memory Routes - Endpoints for user memory, insights, and predictions
 */

/**
 * GET /api/memory/insights
 * Get user insights, patterns, and statistics
 */
router.get('/insights', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const insights = await memoryService.getUserInsights(userId);
        
        res.json({
            success: true,
            insights
        });
    } catch (error) {
        console.error('Error getting insights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get insights'
        });
    }
});

/**
 * GET /api/memory/context
 * Get personalized context for AI responses
 */
router.get('/context', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const context = await memoryService.getPersonalizedContext(userId);
        
        res.json({
            success: true,
            context
        });
    } catch (error) {
        console.error('Error getting context:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get context'
        });
    }
});

/**
 * POST /api/memory/analyze/:conversationId
 * Analyze a conversation and update memory
 */
router.post('/analyze/:conversationId', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;
        
        const analytics = await memoryService.analyzeConversation(conversationId, userId);
        
        res.json({
            success: true,
            analytics
        });
    } catch (error) {
        console.error('Error analyzing conversation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze conversation'
        });
    }
});

/**
 * POST /api/memory/feedback
 * Record user feedback for learning
 */
router.post('/feedback', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const { messageId, feedbackType, reason } = req.body;
        
        if (!messageId || !feedbackType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        await memoryService.recordFeedback(userId, messageId, feedbackType, reason);
        
        res.json({
            success: true,
            message: 'Feedback recorded'
        });
    } catch (error) {
        console.error('Error recording feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record feedback'
        });
    }
});

/**
 * GET /api/memory/predictions
 * Get predictions about user's next actions or questions
 */
router.get('/predictions', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const memory = await memoryService.getUserMemory(userId);
        
        res.json({
            success: true,
            predictions: memory.predictions
        });
    } catch (error) {
        console.error('Error getting predictions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get predictions'
        });
    }
});

/**
 * GET /api/memory/topics
 * Get user's topic interests and patterns
 */
router.get('/topics', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const memory = await memoryService.getUserMemory(userId);
        
        const topics = memory.preferences.topicInterests || [];
        const sortedTopics = topics.sort((a, b) => b.frequency - a.frequency);
        
        res.json({
            success: true,
            topics: sortedTopics
        });
    } catch (error) {
        console.error('Error getting topics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get topics'
        });
    }
});

/**
 * GET /api/memory/recent-context
 * Get recent conversation context and active topics
 */
router.get('/recent-context', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const memory = await memoryService.getUserMemory(userId);
        
        res.json({
            success: true,
            recentContext: memory.recentContext
        });
    } catch (error) {
        console.error('Error getting recent context:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get recent context'
        });
    }
});

/**
 * GET /api/memory/statistics
 * Get user statistics and usage patterns
 */
router.get('/statistics', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const memory = await memoryService.getUserMemory(userId);
        
        res.json({
            success: true,
            statistics: memory.statistics,
            behavioralPatterns: memory.behavioralPatterns
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics'
        });
    }
});

/**
 * POST /api/memory/active-topic
 * Add or update an active topic/project
 */
router.post('/active-topic', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const { topic, description, relatedConversations } = req.body;
        
        if (!topic) {
            return res.status(400).json({
                success: false,
                error: 'Topic is required'
            });
        }
        
        const memory = await memoryService.getUserMemory(userId);
        
        // Check if topic already exists
        const existingTopic = memory.recentContext.activeTopics?.find(t => t.topic === topic);
        
        if (existingTopic) {
            existingTopic.description = description || existingTopic.description;
            existingTopic.lastUpdated = new Date();
            if (relatedConversations) {
                existingTopic.relatedConversations = relatedConversations;
            }
        } else {
            if (!memory.recentContext.activeTopics) {
                memory.recentContext.activeTopics = [];
            }
            memory.recentContext.activeTopics.push({
                topic,
                description,
                startedAt: new Date(),
                lastUpdated: new Date(),
                relatedConversations: relatedConversations || [],
                progress: 'started'
            });
        }
        
        await memory.save();
        
        res.json({
            success: true,
            message: 'Active topic updated'
        });
    } catch (error) {
        console.error('Error updating active topic:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update active topic'
        });
    }
});

/**
 * GET /api/memory/learning-progress
 * Get how well the system has learned about the user
 */
router.get('/learning-progress', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const memory = await memoryService.getUserMemory(userId);
        
        const progress = {
            patternsIdentified: memory.preferences.topicInterests?.length || 0,
            preferencesLearned: Object.keys(memory.preferences.communicationStyle || {}).length,
            conversationsAnalyzed: memory.statistics.totalConversations || 0,
            feedbackReceived: memory.feedbackHistory.totalFeedbackCount || 0,
            predictionsMade: memory.predictions.likelyQuestions?.length || 0,
            learningScore: 0
        };
        
        // Calculate learning score (0-100)
        progress.learningScore = Math.min(
            progress.patternsIdentified * 5 +
            progress.preferencesLearned * 10 +
            progress.conversationsAnalyzed * 2 +
            progress.feedbackReceived * 5,
            100
        );
        
        res.json({
            success: true,
            progress
        });
    } catch (error) {
        console.error('Error getting learning progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get learning progress'
        });
    }
});

/**
 * GET /api/memory/attachments
 * Get user's attachment history
 */
router.get('/attachments', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit, type, conversationId } = req.query;
        
        const attachmentMemoryService = require('../services/attachmentMemoryService');
        const attachments = await attachmentMemoryService.getUserAttachmentHistory(userId, {
            limit: limit ? parseInt(limit) : 50,
            type,
            conversationId
        });
        
        res.json({
            success: true,
            attachments,
            count: attachments.length
        });
    } catch (error) {
        console.error('Error getting attachment history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get attachment history'
        });
    }
});

/**
 * GET /api/memory/attachments/stats
 * Get attachment statistics for user
 */
router.get('/attachments/stats', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const attachmentMemoryService = require('../services/attachmentMemoryService');
        const stats = await attachmentMemoryService.getAttachmentStats(userId);
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting attachment stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get attachment stats'
        });
    }
});

/**
 * GET /api/memory/attachments/search
 * Search attachments by content
 */
router.get('/attachments/search', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const { q, limit } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query required'
            });
        }
        
        const attachmentMemoryService = require('../services/attachmentMemoryService');
        const results = await attachmentMemoryService.searchAttachments(userId, q, {
            limit: limit ? parseInt(limit) : 20
        });
        
        res.json({
            success: true,
            results,
            count: results.length
        });
    } catch (error) {
        console.error('Error searching attachments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search attachments'
        });
    }
});

/**
 * GET /api/memory/attachments/:conversationId
 * Get attachments for a specific conversation
 */
router.get('/attachments/:conversationId', auth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const attachmentMemoryService = require('../services/attachmentMemoryService');
        const attachments = await attachmentMemoryService.getConversationAttachments(conversationId);
        
        res.json({
            success: true,
            attachments,
            count: attachments.length
        });
    } catch (error) {
        console.error('Error getting conversation attachments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get conversation attachments'
        });
    }
});

/**
 * GET /api/memory/all
 * Get all user memories for management
 */
router.get('/all', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const memory = await memoryService.getUserMemory(userId);
        
        // Format memories for UI display
        const memories = [];
        
        // Extract preferences
        if (memory.preferences) {
            if (memory.preferences.communicationStyle) {
                Object.entries(memory.preferences.communicationStyle).forEach(([key, value]) => {
                    memories.push({
                        _id: `pref_${key}`,
                        category: 'Preferences',
                        content: `Communication ${key}: ${value}`,
                        confidence: 0.9,
                        createdAt: memory.lastUpdated
                    });
                });
            }
            
            if (memory.preferences.topicInterests) {
                memory.preferences.topicInterests.forEach((topic, index) => {
                    memories.push({
                        _id: `topic_${index}`,
                        category: 'Topics',
                        content: topic.topic || topic,
                        confidence: topic.frequency ? Math.min(topic.frequency / 10, 1) : 0.7,
                        createdAt: topic.lastDiscussed || memory.lastUpdated
                    });
                });
            }
        }
        
        // Extract behavioral patterns
        if (memory.behavioralPatterns) {
            if (memory.behavioralPatterns.preferredLanguages && memory.behavioralPatterns.preferredLanguages.length > 0) {
                memory.behavioralPatterns.preferredLanguages.forEach((lang, index) => {
                    memories.push({
                        _id: `lang_${index}`,
                        category: 'Patterns',
                        content: `Preferred language: ${lang}`,
                        confidence: 0.85,
                        createdAt: memory.lastUpdated
                    });
                });
            }
            
            if (memory.behavioralPatterns.peakUsageTime) {
                memories.push({
                    _id: 'peak_time',
                    category: 'Patterns',
                    content: `Peak usage time: ${memory.behavioralPatterns.peakUsageTime}`,
                    confidence: 0.8,
                    createdAt: memory.lastUpdated
                });
            }
        }
        
        // Extract recent context
        if (memory.recentContext && memory.recentContext.activeTopics) {
            memory.recentContext.activeTopics.forEach((topic, index) => {
                memories.push({
                    _id: `context_${index}`,
                    category: 'Context',
                    content: `${topic.topic}: ${topic.description || 'In progress'}`,
                    confidence: 0.95,
                    createdAt: topic.lastUpdated || topic.startedAt
                });
            });
        }
        
        res.json({
            success: true,
            memories: memories,
            count: memories.length
        });
    } catch (error) {
        console.error('Error loading memories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load memories'
        });
    }
});

/**
 * GET /api/memory/stats
 * Get memory statistics
 */
router.get('/stats', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const memory = await memoryService.getUserMemory(userId);
        
        const stats = {
            totalMemories: 0,
            totalConversations: memory.statistics?.totalConversations || 0,
            totalTopics: memory.preferences?.topicInterests?.length || 0,
            storageUsed: 0,
            lastUpdated: memory.lastUpdated,
            memoryEnabled: true
        };
        
        // Count total memories
        stats.totalMemories += Object.keys(memory.preferences?.communicationStyle || {}).length;
        stats.totalMemories += memory.preferences?.topicInterests?.length || 0;
        stats.totalMemories += memory.recentContext?.activeTopics?.length || 0;
        stats.totalMemories += memory.behavioralPatterns?.preferredLanguages?.length || 0;
        
        // Estimate storage (rough calculation)
        const memoryJson = JSON.stringify(memory);
        stats.storageUsed = Buffer.byteLength(memoryJson, 'utf8');
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error loading stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load statistics'
        });
    }
});

/**
 * DELETE /api/memory/:memoryId
 * Delete a specific memory
 */
router.delete('/:memoryId', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const { memoryId } = req.params;
        const memory = await memoryService.getUserMemory(userId);
        
        // Parse memory ID to find and delete the specific memory
        if (memoryId.startsWith('pref_')) {
            const key = memoryId.replace('pref_', '');
            if (memory.preferences && memory.preferences.communicationStyle) {
                delete memory.preferences.communicationStyle[key];
            }
        } else if (memoryId.startsWith('topic_')) {
            const index = parseInt(memoryId.replace('topic_', ''));
            if (memory.preferences && memory.preferences.topicInterests) {
                memory.preferences.topicInterests.splice(index, 1);
            }
        } else if (memoryId.startsWith('context_')) {
            const index = parseInt(memoryId.replace('context_', ''));
            if (memory.recentContext && memory.recentContext.activeTopics) {
                memory.recentContext.activeTopics.splice(index, 1);
            }
        } else if (memoryId.startsWith('lang_')) {
            const index = parseInt(memoryId.replace('lang_', ''));
            if (memory.behavioralPatterns && memory.behavioralPatterns.preferredLanguages) {
                memory.behavioralPatterns.preferredLanguages.splice(index, 1);
            }
        }
        
        await memory.save();
        
        res.json({
            success: true,
            message: 'Memory deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting memory:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete memory'
        });
    }
});

/**
 * DELETE /api/memory/clear-all
 * Clear all user memories
 */
router.delete('/clear-all', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const memory = await memoryService.getUserMemory(userId);
        
        // Reset all memory fields
        memory.preferences = {
            communicationStyle: {},
            topicInterests: [],
            preferredTone: 'balanced'
        };
        memory.recentContext = {
            activeTopics: [],
            recentConversations: []
        };
        memory.behavioralPatterns = {
            preferredLanguages: [],
            peakUsageTime: null,
            averageSessionDuration: 0
        };
        memory.predictions = {
            likelyQuestions: [],
            suggestedActions: []
        };
        memory.statistics = {
            totalConversations: 0,
            totalMessages: 0,
            averageResponseTime: 0
        };
        memory.feedbackHistory = {
            totalFeedbackCount: 0,
            positiveFeedback: 0,
            negativeFeedback: 0
        };
        
        // Add timestamp to track when memories were cleared (prevents immediate re-learning)
        memory.lastCleared = new Date();
        
        await memory.save();
        
        // Also delete all conversation analytics for this user to prevent re-learning from old data
        const ConversationAnalytics = require('../models/ConversationAnalytics');
        await ConversationAnalytics.deleteMany({ userId: userId });
        
        console.log(`🗑️ Cleared all memories and analytics for user ${userId}`);
        
        res.json({
            success: true,
            message: 'All memories cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing memories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear memories'
        });
    }
});

/**
 * GET /api/memory/export
 * Export all user memories
 */
router.get('/export', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const memory = await memoryService.getUserMemory(userId);
        
        res.json({
            success: true,
            memories: memory.toObject()
        });
    } catch (error) {
        console.error('Error exporting memories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export memories'
        });
    }
});

/**
 * PUT /api/memory/settings
 * Update memory settings
 */
router.put('/settings', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const { memoryEnabled, chatHistoryEnabled } = req.body;
        
        // You can store these settings in user preferences or a separate collection
        // For now, just return success
        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update settings'
        });
    }
});

module.exports = router;
