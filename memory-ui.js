/**
 * Memory and Insights UI Module
 * Displays user insights, predictions, and personalized suggestions
 */

// API Base URL - Only declare if not already defined
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'http://localhost:3000';
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('authToken') || '';
}

// Get auth headers - user-id is extracted from JWT token on backend
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
    };
}

/**
 * Insert new line at cursor position (for mobile devices)
 */
function insertNewLine() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    
    input.value = value.substring(0, start) + '\n' + value.substring(end);
    input.selectionStart = input.selectionEnd = start + 1;
    
    // Trigger resize if function exists
    if (typeof updateCharCounter === 'function') {
        updateCharCounter();
    }
    input.focus();
}

/**
 * Load and display user insights
 */
async function loadUserInsights() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/memory/insights`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to load insights');
        }
        
        const data = await response.json();
        if (data.success) {
            displayInsights(data.insights);
        }
    } catch (error) {
        console.error('Error loading insights:', error);
    }
}

/**
 * Display insights in the UI
 */
function displayInsights(insights) {
    const container = document.getElementById('insightsContainer');
    if (!container) return;
    
    let html = '<div class="insights-panel">';
    
    // Top Topics
    if (insights.topTopics && insights.topTopics.length > 0) {
        html += '<div class="insight-section">';
        html += '<h3><i class="fas fa-chart-line"></i> Your Top Topics</h3>';
        html += '<div class="topic-cloud">';
        insights.topTopics.forEach(topic => {
            const size = Math.min(12 + topic.frequency * 2, 24);
            html += `<span class="topic-tag" style="font-size: ${size}px">${topic.topic}</span>`;
        });
        html += '</div></div>';
    }
    
    // Recent Activity
    if (insights.recentActivity) {
        html += '<div class="insight-section">';
        html += '<h3><i class="fas fa-activity"></i> Recent Activity</h3>';
        html += `<div class="stat-grid">`;
        html += `<div class="stat-item">
            <span class="stat-value">${insights.recentActivity.totalConversations}</span>
            <span class="stat-label">Conversations</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-value">${insights.recentActivity.totalMessages}</span>
            <span class="stat-label">Messages</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-value">${Math.round(insights.recentActivity.averageEngagement)}%</span>
            <span class="stat-label">Engagement</span>
        </div>`;
        html += `</div></div>`;
    }
    
    // Predictions
    if (insights.predictions && insights.predictions.likelyQuestions && insights.predictions.likelyQuestions.length > 0) {
        html += '<div class="insight-section">';
        html += '<h3><i class="fas fa-lightbulb"></i> You Might Be Interested In</h3>';
        html += '<div class="predictions-list">';
        insights.predictions.likelyQuestions.slice(0, 5).forEach(pred => {
            html += `<div class="prediction-item" onclick="askPredictedQuestion('${pred.question.replace(/'/g, "\\'")}')"}>
                <span class="prediction-text">${pred.question}</span>
                <span class="prediction-confidence">${Math.round(pred.probability * 100)}%</span>
            </div>`;
        });
        html += '</div></div>';
    }
    
    // Active Topics
    if (insights.activeTopics && insights.activeTopics.length > 0) {
        html += '<div class="insight-section">';
        html += '<h3><i class="fas fa-project-diagram"></i> Active Projects</h3>';
        insights.activeTopics.forEach(topic => {
            html += `<div class="active-topic-card">
                <h4>${topic.topic}</h4>
                <p>${topic.description || ''}</p>
                <span class="topic-date">Started: ${new Date(topic.startedAt).toLocaleDateString()}</span>
            </div>`;
        });
        html += '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Ask a predicted question
 */
function askPredictedQuestion(question) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = question;
        input.focus();
        // Trigger send if sendMessage function exists
        if (typeof sendMessage === 'function') {
            sendMessage();
        }
    }
}

/**
 * Load predictions
 */
async function loadPredictions() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/memory/predictions`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to load predictions');
        }
        
        const data = await response.json();
        if (data.success && data.predictions) {
            displayPredictions(data.predictions);
        }
    } catch (error) {
        console.error('Error loading predictions:', error);
    }
}

/**
 * Display predictions
 */
function displayPredictions(predictions) {
    const container = document.getElementById('predictionsContainer');
    if (!container) return;
    
    let html = '<div class="predictions-panel">';
    
    // Suggested Topics
    if (predictions.suggestedTopics && predictions.suggestedTopics.length > 0) {
        html += '<h4>Topics You Might Like</h4>';
        predictions.suggestedTopics.forEach(topic => {
            html += `<div class="suggested-topic">
                <span class="topic-name">${topic.topic}</span>
                <span class="topic-reason">${topic.reason}</span>
            </div>`;
        });
    }
    
    // Likely Questions
    if (predictions.likelyQuestions && predictions.likelyQuestions.length > 0) {
        html += '<h4>Questions You Might Ask</h4>';
        predictions.likelyQuestions.forEach(q => {
            html += `<div class="predicted-question" onclick="askPredictedQuestion('${q.question.replace(/'/g, "\\'")}')"}>
                <i class="fas fa-question-circle"></i> ${q.question}
            </div>`;
        });
    }
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Record feedback for learning
 */
async function recordFeedback(messageId, feedbackType, reason = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/api/memory/feedback`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                messageId,
                feedbackType,
                reason
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to record feedback');
        }
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Feedback recorded');
            // Show subtle confirmation
            showFeedbackConfirmation();
        }
    } catch (error) {
        console.error('Error recording feedback:', error);
    }
}

/**
 * Show feedback confirmation
 */
function showFeedbackConfirmation() {
    const notification = document.createElement('div');
    notification.className = 'feedback-confirmation';
    notification.textContent = 'Thanks for your feedback! I\'m learning...';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

/**
 * Load learning progress
 */
async function loadLearningProgress() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/memory/learning-progress`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to load learning progress');
        }
        
        const data = await response.json();
        if (data.success && data.progress) {
            displayLearningProgress(data.progress);
        }
    } catch (error) {
        console.error('Error loading learning progress:', error);
    }
}

/**
 * Display learning progress
 */
function displayLearningProgress(progress) {
    const container = document.getElementById('learningProgressContainer');
    if (!container) return;
    
    const score = progress.learningScore || 0;
    
    let html = `
        <div class="learning-progress-panel">
            <h3>AI Learning Progress</h3>
            <div class="progress-circle">
                <svg width="120" height="120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#e0e0e0" stroke-width="8"/>
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#667eea" stroke-width="8"
                            stroke-dasharray="${score * 3.39} 339" 
                            stroke-linecap="round" 
                            transform="rotate(-90 60 60)"/>
                </svg>
                <div class="progress-text">${score}%</div>
            </div>
            <div class="progress-stats">
                <div class="progress-stat">
                    <span class="stat-value">${progress.patternsIdentified}</span>
                    <span class="stat-label">Patterns Found</span>
                </div>
                <div class="progress-stat">
                    <span class="stat-value">${progress.conversationsAnalyzed}</span>
                    <span class="stat-label">Chats Analyzed</span>
                </div>
                <div class="progress-stat">
                    <span class="stat-value">${progress.feedbackReceived}</span>
                    <span class="stat-label">Feedback Received</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Load all user memories
 */
async function loadUserMemories() {
    const container = document.getElementById('memoriesManagementContainer');
    
    // Check authentication - only need auth token, user is extracted from JWT
    const authToken = getAuthToken();
    
    console.log('🔍 Auth check:', { 
        hasToken: !!authToken, 
        tokenLength: authToken ? authToken.length : 0
    });
    
    // If no auth token, show message
    if (!authToken) {
        console.warn('⚠️ User not authenticated - no auth token');
        if (container) {
            container.innerHTML = `
                <div class="no-memories">
                    <i class="fas fa-user-lock"></i>
                    <p>Please log in to view your memories</p>
                </div>
            `;
        }
        return;
    }
    
    if (container) {
        container.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> Loading memories...</p>';
    }
    
    try {
        // Add cache busting
        const timestamp = Date.now();
        const response = await fetch(`${API_BASE_URL}/api/memory/all?t=${timestamp}`, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        
        console.log('Load memories response:', response.status);
        
        if (response.status === 401) {
            if (container) {
                container.innerHTML = `
                    <div class="no-memories">
                        <i class="fas fa-user-lock"></i>
                        <p>Session expired. Please log in again.</p>
                    </div>
                `;
            }
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Memories data:', data);
        
        if (data.success) {
            displayUserMemories(data.memories || []);
        } else {
            displayUserMemories([]);
        }
    } catch (error) {
        console.error('Error loading memories:', error);
        if (container) {
            container.innerHTML = `
                <div class="no-memories">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load memories. Please try again.</p>
                </div>
            `;
        }
    }
}

/**
 * Display user memories in management UI
 */
function displayUserMemories(memories) {
    const container = document.getElementById('memoriesManagementContainer');
    if (!container) {
        console.error('Memories container not found!');
        return;
    }
    
    console.log('Displaying memories:', memories);
    
    if (!memories || memories.length === 0) {
        container.innerHTML = `
            <div class="no-memories">
                <i class="fas fa-brain"></i>
                <p>No memories stored yet. Start chatting and I'll learn your preferences!</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="memories-list">';
    
    // Group memories by category
    const grouped = {};
    memories.forEach(mem => {
        const category = mem.category || 'General';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(mem);
    });
    
    console.log('Grouped memories:', grouped);
    
    // Display grouped memories
    Object.keys(grouped).forEach(category => {
        html += `<div class="memory-category">`;
        html += `<h4><i class="fas fa-folder"></i> ${category}</h4>`;
        
        grouped[category].forEach(mem => {
            const memoryId = mem._id || mem.id;
            const date = new Date(mem.timestamp || mem.createdAt).toLocaleDateString();
            const content = mem.content || mem.memory || mem.text || 'No content';
            
            console.log('Rendering memory:', memoryId, content);
            
            html += `
                <div class="memory-item" data-id="${memoryId}">
                    <div class="memory-content">
                        <div class="memory-text">${content}</div>
                        <div class="memory-meta">
                            <span class="memory-date"><i class="fas fa-clock"></i> ${date}</span>
                            ${mem.confidence ? `<span class="memory-confidence">Confidence: ${Math.round(mem.confidence * 100)}%</span>` : ''}
                        </div>
                    </div>
                    <div class="memory-actions">
                        <button class="btn-icon" onclick="window.editMemory('${memoryId}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="window.deleteMemory('${memoryId}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    html += '</div>';
    console.log('Setting HTML for memories container');
    container.innerHTML = html;
}

/**
 * Delete a specific memory
 */
async function deleteMemory(memoryId) {
    console.log('Delete memory called:', memoryId);
    
    if (!confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
        return;
    }
    
    const container = document.getElementById('memoriesManagementContainer');
    if (container) {
        container.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> Deleting...</p>';
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/memory/${memoryId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        console.log('Delete response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to delete: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Delete response:', data);
        
        if (data.success) {
            showSuccess('Memory deleted successfully');
            // Clear any cached data
            localStorage.removeItem('cachedMemories');
            // Reload after brief delay
            setTimeout(() => loadUserMemories(), 300);
        } else {
            throw new Error(data.error || 'Failed to delete memory');
        }
    } catch (error) {
        console.error('Error deleting memory:', error);
        showError(error.message || 'Failed to delete memory');
        loadUserMemories(); // Reload to show current state
    }
}

/**
 * Clear all user memories
 */
async function clearAllMemories() {
    console.log('Clear all memories called');
    
    // Check if user has auth token
    const authToken = getAuthToken();
    if (!authToken) {
        showError('Please log in first to clear memories.');
        return;
    }
    
    const confirmed = confirm(
        'Are you sure you want to delete ALL your memories?\n\n' +
        'This will:\n' +
        '• Remove all stored conversations\n' +
        '• Delete all learned preferences\n' +
        '• Clear all insights and predictions\n' +
        '• Reset your AI personalization\n\n' +
        'This action CANNOT be undone!'
    );
    
    if (!confirmed) {
        console.log('Clear all cancelled by user');
        return;
    }
    
    // Double confirmation for safety
    const doubleConfirm = prompt('Type "DELETE ALL" to confirm this action:');
    console.log('Double confirm input:', doubleConfirm);
    
    if (doubleConfirm !== 'DELETE ALL') {
        showError('Action cancelled. Type exactly "DELETE ALL" to confirm.');
        return;
    }
    
    try {
        console.log('Sending clear all request...');
        const headers = getAuthHeaders();
        console.log('Request headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : 'none' });
        
        const response = await fetch(`${API_BASE_URL}/api/memory/clear-all`, {
            method: 'DELETE',
            headers: headers
        });
        
        console.log('Clear all response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Failed to clear memories');
        }
        
        const data = await response.json();
        console.log('Clear all response:', data);
        
        if (data.success) {
            // Clear all cached data
            localStorage.removeItem('cachedMemories');
            localStorage.removeItem('userMemories');
            
            showSuccess('All memories have been deleted. Your AI will start learning fresh.');
            
            // Show empty state immediately
            const container = document.getElementById('memoriesManagementContainer');
            if (container) {
                container.innerHTML = `
                    <div class="no-memories">
                        <i class="fas fa-check-circle"></i>
                        <p>All memories cleared! The AI will learn from your future conversations.</p>
                    </div>
                `;
            }
            
            // Reload after delay
            setTimeout(() => {
                loadUserMemories();
                if (typeof loadUserInsights === 'function') {
                    loadUserInsights();
                }
            }, 1000);
        } else {
            throw new Error(data.error || 'Failed to clear memories');
        }
    } catch (error) {
        console.error('Error clearing memories:', error);
        showError('Failed to clear memories');
    }
}

/**
 * Export user memories as JSON
 */
async function exportMemories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/memory/export`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to export memories');
        }
        
        const data = await response.json();
        if (data.success) {
            // Create download
            const blob = new Blob([JSON.stringify(data.memories, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `copilot-memories-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showSuccess('Memories exported successfully');
        }
    } catch (error) {
        console.error('Error exporting memories:', error);
        showError('Failed to export memories');
    }
}

/**
 * Get memory statistics
 */
async function getMemoryStats() {
    const container = document.getElementById('memoryStatsContainer');
    if (container) {
        container.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> Loading statistics...</p>';
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/memory/stats`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to load statistics');
        }
        
        const data = await response.json();
        console.log('Stats response:', data);
        
        if (data.success && data.stats) {
            displayMemoryStats(data.stats);
        } else {
            throw new Error('Invalid stats response');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        if (container) {
            container.innerHTML = `
                <div class="no-memories">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load statistics. Please try again.</p>
                    <button class="btn btn-primary" onclick="getMemoryStats()" style="margin-top: 16px;">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Display memory statistics
 */
function displayMemoryStats(stats) {
    const container = document.getElementById('memoryStatsContainer');
    if (!container) {
        console.error('Stats container not found');
        return;
    }
    
    console.log('Displaying stats:', stats);
    
    const html = `
        <div class="memory-stats-panel">
            <h3><i class="fas fa-chart-bar"></i> Memory Statistics</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-brain"></i>
                    <div class="stat-value">${stats.totalMemories || 0}</div>
                    <div class="stat-label">Total Memories</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-comments"></i>
                    <div class="stat-value">${stats.totalConversations || 0}</div>
                    <div class="stat-label">Conversations</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-tags"></i>
                    <div class="stat-value">${stats.totalTopics || 0}</div>
                    <div class="stat-label">Topics</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-database"></i>
                    <div class="stat-value">${formatBytes(stats.storageUsed || 0)}</div>
                    <div class="stat-label">Storage Used</div>
                </div>
            </div>
            <div class="storage-info">
                <p><i class="fas fa-info-circle"></i> Last updated: ${new Date(stats.lastUpdated || Date.now()).toLocaleString()}</p>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Edit a memory
 */
function editMemory(memoryId) {
    // TODO: Implement edit functionality with modal
    console.log('Edit memory:', memoryId);
    showError('Edit feature coming soon!');
}

/**
 * Toggle memory feature on/off
 */
async function toggleMemoryFeature(enabled) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/memory/settings`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                memoryEnabled: enabled,
                chatHistoryEnabled: enabled
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update settings');
        }
        
        const data = await response.json();
        if (data.success) {
            showSuccess(`Memory feature ${enabled ? 'enabled' : 'disabled'}`);
            localStorage.setItem('memoryEnabled', enabled);
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        showError('Failed to update settings');
    }
}

/**
 * Show memory management modal
 */
function showMemoryManagement() {
    console.log('Opening Memory Management modal...');
    
    const modal = document.createElement('div');
    modal.className = 'memory-modal';
    modal.innerHTML = `
        <div class="memory-modal-content">
            <div class="memory-modal-header">
                <h2><i class="fas fa-brain"></i> Memory Management</h2>
                <button class="btn-close" onclick="window.closeMemoryManagement()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="memory-modal-body">
                <!-- Tabs -->
                <div class="memory-tabs">
                    <button class="memory-tab active" onclick="window.switchMemoryTab('memories', this)">Memories</button>
                    <button class="memory-tab" onclick="window.switchMemoryTab('stats', this)">Statistics</button>
                    <button class="memory-tab" onclick="window.switchMemoryTab('settings', this)">Settings</button>
                </div>
                
                <!-- Memories Tab -->
                <div id="memoryTab-memories" class="memory-tab-content active">
                    <div class="memory-actions-bar">
                        <button class="btn btn-primary" onclick="window.loadUserMemories()">
                            <i class="fas fa-refresh"></i> Refresh
                        </button>
                        <button class="btn btn-secondary" onclick="window.exportMemories()">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <button class="btn btn-danger" onclick="window.clearAllMemories()">
                            <i class="fas fa-trash-alt"></i> Clear All
                        </button>
                    </div>
                    <div id="memoriesManagementContainer" class="memories-container">
                        <p class="loading"><i class="fas fa-spinner fa-spin"></i> Loading memories...</p>
                    </div>
                </div>
                
                <!-- Stats Tab -->
                <div id="memoryTab-stats" class="memory-tab-content">
                    <div id="memoryStatsContainer">
                        <p class="loading"><i class="fas fa-spinner fa-spin"></i> Loading statistics...</p>
                    </div>
                </div>
                
                <!-- Settings Tab -->
                <div id="memoryTab-settings" class="memory-tab-content">
                    <div class="memory-settings">
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="memoryEnabled" onchange="window.toggleMemoryFeature(this.checked)">
                                <span>Enable Memory Learning</span>
                            </label>
                            <p class="setting-description">Allow AI to remember your preferences and conversation history</p>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="chatHistoryEnabled">
                                <span>Reference Chat History</span>
                            </label>
                            <p class="setting-description">Let AI reference recent conversations when responding</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('Modal added to DOM');
    
    // Load initial data
    setTimeout(() => {
        console.log('Starting to load data...');
        loadUserMemories();
        getMemoryStats();
    }, 100);
    
    // Set checkbox states
    setTimeout(() => {
        const memoryEnabled = localStorage.getItem('memoryEnabled') !== 'false';
        const memEnabledCheckbox = document.getElementById('memoryEnabled');
        const chatEnabledCheckbox = document.getElementById('chatHistoryEnabled');
        
        if (memEnabledCheckbox) memEnabledCheckbox.checked = memoryEnabled;
        if (chatEnabledCheckbox) chatEnabledCheckbox.checked = memoryEnabled;
        
        console.log('Checkboxes set:', memoryEnabled);
    }, 150);
}

/**
 * Close memory management modal
 */
function closeMemoryManagement() {
    const modal = document.querySelector('.memory-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Switch between memory tabs
 */
function switchMemoryTab(tabName, clickedButton) {
    console.log('Switching to tab:', tabName);
    
    // Update tab buttons
    document.querySelectorAll('.memory-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Find and activate the clicked button
    if (clickedButton) {
        clickedButton.classList.add('active');
    } else {
        // Fallback: find button by tab name
        const buttons = document.querySelectorAll('.memory-tab');
        buttons.forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tabName)) {
                btn.classList.add('active');
            }
        });
    }
    
    // Update tab content
    document.querySelectorAll('.memory-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const tabContent = document.getElementById(`memoryTab-${tabName}`);
    if (tabContent) {
        tabContent.classList.add('active');
        console.log('Activated tab content:', tabName);
    } else {
        console.error('Tab content not found:', `memoryTab-${tabName}`);
    }
    
    // Load data for the selected tab
    if (tabName === 'stats') {
        console.log('Loading stats...');
        getMemoryStats();
    } else if (tabName === 'memories') {
        console.log('Loading memories...');
        loadUserMemories();
    }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Show success message
 */
function showSuccess(message) {
    showNotification(message, 'success');
}

/**
 * Show error message
 */
function showError(message) {
    showNotification(message, 'error');
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Initialize memory UI
 */
function initMemoryUI() {
    // Load insights on page load if user is authenticated
    const authToken = getAuthToken();
    if (authToken) {
        loadUserInsights();
        loadLearningProgress();
    }
}

/**
 * Clear AI memories directly from Settings (simpler flow)
 */
async function clearAIMemoriesFromSettings(e) {
    console.log('Clear AI Memories from Settings called');
    
    // Check if user has auth token
    const authToken = getAuthToken();
    if (!authToken) {
        alert('Please log in first to clear AI memories.');
        return;
    }
    
    const confirmed = confirm(
        '⚠️ DELETE ALL AI MEMORIES?\n\n' +
        'This will permanently delete:\n' +
        '• All learned preferences\n' +
        '• All conversation insights\n' +
        '• All topic interests\n' +
        '• All AI personalization\n\n' +
        'The AI will forget everything about you and treat you like a new user.\n\n' +
        'This action CANNOT be undone!'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        // Show loading state - safely get button
        const btn = e ? e.target.closest('button') : document.querySelector('.settings-btn-danger');
        let originalText = '';
        if (btn) {
            originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Clearing...';
            btn.disabled = true;
        }
        
        console.log('Sending DELETE request to /api/memory/clear-all');
        const response = await fetch(`${API_BASE_URL}/api/memory/clear-all`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Failed to clear memories - Status: ' + response.status);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            // Clear local storage cache
            localStorage.removeItem('cachedMemories');
            localStorage.removeItem('userMemories');
            
            // Show success
            if (btn) {
                btn.innerHTML = '<i class="fas fa-check"></i> Cleared!';
                btn.style.background = '#10b981';
            }
            
            alert('✅ All AI memories have been cleared!\n\nThe AI will now treat you like a new user. Refresh the page to see the change.');
            
            // Reset button after delay
            if (btn) {
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 3000);
            }
        } else {
            throw new Error(data.error || 'Failed to clear memories');
        }
    } catch (error) {
        console.error('Error clearing AI memories:', error);
        alert('❌ Failed to clear memories: ' + error.message);
        
        // Reset button
        const btn = document.querySelector('.settings-btn-danger');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-trash-alt"></i> Clear All';
            btn.disabled = false;
        }
    }
}

// Export functions for global use
window.loadUserInsights = loadUserInsights;
window.loadPredictions = loadPredictions;
window.recordFeedback = recordFeedback;
window.loadLearningProgress = loadLearningProgress;
window.askPredictedQuestion = askPredictedQuestion;
window.initMemoryUI = initMemoryUI;
window.showMemoryManagement = showMemoryManagement;
window.closeMemoryManagement = closeMemoryManagement;
window.loadUserMemories = loadUserMemories;
window.deleteMemory = deleteMemory;
window.clearAllMemories = clearAllMemories;
window.clearAIMemoriesFromSettings = clearAIMemoriesFromSettings;
window.exportMemories = exportMemories;
window.getMemoryStats = getMemoryStats;
window.toggleMemoryFeature = toggleMemoryFeature;
window.switchMemoryTab = switchMemoryTab;
window.editMemory = editMemory;