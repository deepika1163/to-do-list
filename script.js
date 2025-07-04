document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const taskCount = document.getElementById('task-count');
    const completedCount = document.getElementById('completed-count');
    const prioritySelect = document.getElementById('priority-select');
    const dueDateInput = document.getElementById('due-date');
    const filterAll = document.getElementById('filter-all');
    const filterActive = document.getElementById('filter-active');
    const filterCompleted = document.getElementById('filter-completed');
    const clearCompletedBtn = document.getElementById('clear-completed');

    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

    // Initialize
    renderTasks();
    updateStats();
    updateEmptyState();

    // Event Listeners
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    
    filterAll.addEventListener('click', () => setFilter('all'));
    filterActive.addEventListener('click', () => setFilter('active'));
    filterCompleted.addEventListener('click', () => setFilter('completed'));
    
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);

    // Functions
    function addTask() {
        const text = taskInput.value.trim();
        if (!text || text.length < 3) {
            alert("Task must be at least 3 characters long.");
            return;
        }
        
        const priority = prioritySelect.value;
        const dueDate = dueDateInput.value || null;
        
        const newTask = {
            id: Date.now(),
            text,
            completed: false,
            priority,
            dueDate,
            createdAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateStats();
        
        taskInput.value = '';
        dueDateInput.value = '';
        prioritySelect.value = 'medium';
        taskInput.focus();
    }
    
    function renderTasks() {
        taskList.innerHTML = '';
        
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });
        
        filteredTasks.forEach(task => {
            const taskEl = document.createElement('li');
            taskEl.className = `task-item p-4 ${task.completed ? 'completed' : ''} priority-${task.priority} bg-white hover:bg-gray-50`;
            taskEl.dataset.id = task.id;
            
            const dateInfo = task.dueDate 
                ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'No due date';
                
            taskEl.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 flex-grow">
                        <input 
                            type="checkbox" 
                            ${task.completed ? 'checked' : ''}
                            class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        >
                        <div class="flex-grow">
                            <div class="flex items-center">
                                <span class="task-text ${task.completed ? 'line-through' : ''}">${task.text}</span>
                                <span class="ml-2 text-xs px-2 py-1 rounded ${getPriorityClass(task.priority)}">
                                    ${task.priority}
                                </span>
                                ${task.dueDate ? `<span class="ml-2 text-xs px-2 py-1 bg-gray-200 rounded">${dateInfo}</span>` : ''}
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                Added ${new Date(task.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="edit-btn p-1 text-gray-500 hover:text-indigo-600">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="delete-btn p-1 text-gray-500 hover:text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            
            taskList.appendChild(taskEl);
            
            // Add event listeners to the new elements
            const checkbox = taskEl.querySelector('input[type="checkbox"]');
            const editBtn = taskEl.querySelector('.edit-btn');
            const deleteBtn = taskEl.querySelector('.delete-btn');
            const taskText = taskEl.querySelector('.task-text');
            
            checkbox.addEventListener('change', () => toggleComplete(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            editBtn.addEventListener('click', () => enableEdit(task.id, taskText));
        });
        
        updateEmptyState();
    }
    
    function enableEdit(id, textElement) {
        const currentText = textElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'edit-input px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500';
        
        textElement.replaceWith(input);
        input.focus();
        
        function saveEdit() {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                const taskIndex = tasks.findIndex(task => task.id === id);
                if (taskIndex !== -1) {
                    tasks[taskIndex].text = newText;
                    saveTasks();
                }
            }
            renderTasks();
        }
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') saveEdit();
        });
    }
    
    function toggleComplete(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks();
            updateStats();
        }
    }
    
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    function clearCompletedTasks() {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    function setFilter(filter) {
        currentFilter = filter;
        
        // Update filter button styles
        filterAll.className = 'px-3 py-1 rounded-lg text-sm ' + (filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-100');
        filterActive.className = 'px-3 py-1 rounded-lg text-sm ' + (filter === 'active' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-100');
        filterCompleted.className = 'px-3 py-1 rounded-lg text-sm ' + (filter === 'completed' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-100');
        
        renderTasks();
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function updateStats() {
        taskCount.textContent = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        completedCount.textContent = `${completedTasks} completed`;
    }
    
    function updateEmptyState() {
        emptyState.style.display = tasks.length === 0 ? 'block' : 'none';
    }
    
    function getPriorityClass(priority) {
        switch(priority) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return '';
        }
    }
});
