let db;
let mediaStream = null;

document.addEventListener("DOMContentLoaded", () => {
    //Service worker
    let service_Worker_Registration = null;

    if("serviceWorker" in navigator && "Notification" in window){
        navigator.serviceWorker.register("service_worker.js").then((reg) => {
            service_Worker_Registration = reg;
            console.log("Service worker registered!");
        }).catch((err) => {
            console.error("Service worker failed:", err);
        });

        if(Notification.permission == "default"){
            Notification.requestPermission();
        }
    }

    function scheduleNotif(title, reminderTimeStr){
        if(!reminderTimeStr) return;
        const delay = new Date(reminderTimeStr).getTime() - Date.now();

        if(delay > 0 && Notification.permission == "granted"){
            navigator.serviceWorker.ready.then((reg) => {
                reg.active.postMessage({
                    type: "SCHEDULE_NOTIFICATION",
                    title: "Task Reminder!",
                    body: `Don't Forget ${title}`,
                    delay: delay
                });
            });
        }
    }
    
    //Indexed db start
    //creates task database
    const request = indexedDB.open("TaskDB", 2)
    
    request.onupgradeneeded = (event) => {
        db = event.target.result;
    
        //creates object store named "tasks" if there isn't any
        if(!db.objectStoreNames.contains("tasks")){
            db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
        }
    };
    
    //runs when succesfully connected to db
    request.onsuccess = (event) => {
        db = event.target.result
        console.log("Database opened.")

        loadTask();
    };
    
    request.onerror = (event) => {
        console.error("Error in opening Database:", event.target.error)
    };

    function loadTask() {
        //starts transaction on "tasks" store with read only perms
        const transaction = db.transaction(["tasks"], "readonly");
        const store = transaction.objectStore("tasks");
    
        const get_request = store.getAll();
    
        get_request.onsuccess = () => {
            todos = get_request.result;
            if(todos.length > 0 && selectedTaskId == null){
                selectedTaskId = todos[0].id
            }

            startList();
            startDetail();
        };
    
        get_request.onerror = (event) => {
            console.error("Failed to retrieve tasks:", event.target.error);
        };
    }   
    //end of indexedDB

    let todos = [];
    let selectedTaskId = null;
    let editingTaskId = null;

    // DOM Elements
    const themeToggleBtn = document.getElementById("modeToggle");
    const todoList = document.getElementById("todoList");
    const todoForm = document.getElementById("todoForm");
    const taskTitleInput = document.getElementById("taskTitle");
    const taskDescInput = document.getElementById("taskDesc");
    const taskDateInput = document.getElementById("taskDate");
    const taskNotifInput = document.getElementById("reminderDate");
    const submitBtn = document.getElementById("submitBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const formHeading = document.getElementById("formHeading");

    const detailTitle = document.getElementById("detailTitle");
    const detailDate = document.getElementById("detailDate");
    const detailStatus = document.getElementById("detailStatus");
    const detailDesc = document.getElementById("detailDesc");
    const editBtn = document.getElementById("editBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    const video_element = document.getElementById("videoElm");
    const canvas_element = document.getElementById("canvasElm");
    const capMedBtn = document.getElementById("camera-Video");
    const takePicBtn = document.getElementById("take-picture");
    const photoView = document.getElementById("photoPreview");
    const image_element = document.getElementById('detailImage')

    // 1. Dark Mode Toggle
    const saved_theme = localStorage.getItem("theme");
    if(saved_theme == "dark"){
        document.body.classList.add("dark-mode");
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            const isDark = document.body.classList.contains("dark-mode");

            if (isDark){
                localStorage.setItem("theme", "dark");
            } else{
                localStorage.setItem("theme", "light");
            }
        });
    }

    // Render list items dynamically
    function startList() {
        todoList.innerHTML = "";

        todos.forEach((todo) => {
            const li = document.createElement("li");
            li.className = `todoItem ${todo.id === selectedTaskId ? "active" : ""} ${todo.completed ? "completed" : ""}`;
            li.dataset.id = todo.id;

            li.innerHTML = `
                <input type="checkbox" class="todoCheckbox" ${todo.completed ? "checked" : ""}>
                <div class="taskContent">
                    <h3>${todo.title}</h3>
                    <p>Due: ${todo.dueDate || "No date"}</p>
                </div>
            `;

            const checkbox = li.querySelector(".todoCheckbox");

            // Stop click propagation to prevent triggering <li> click
            checkbox.addEventListener("click", () => {
                todo.completed = checkbox.checked;

                const transaction = db.transaction(["tasks"], "readwrite");
                transaction.objectStore("tasks").put(todo);

                startList();
                startDetail();
            });

            // Select task on card click (ignoring checkbox)
            li.addEventListener("click", (e) => {
                if (e.target !== checkbox) {
                    selectedTaskId = todo.id;
                    startList();
                    startDetail();
                }
            });

            todoList.appendChild(li);
        });
    }

    // Render detail panel view
    function startDetail() {
        const selectedTodo = todos.find((t) => t.id === selectedTaskId);

        if (!selectedTodo) {
            detailTitle.textContent = "No task selected";
            detailDate.textContent = "-";
            detailStatus.textContent = "-";
            detailDesc.textContent = "Select or create a task from the list.";
            editBtn.style.display = "none";
            deleteBtn.style.display = "none";
            return;
        }

        editBtn.style.display = "inline-block";
        deleteBtn.style.display = "inline-block";

        detailTitle.textContent = selectedTodo.title;
        detailDate.textContent = selectedTodo.dueDate || "No due date";
        detailStatus.textContent = selectedTodo.completed ? "Completed" : "Pending";
        detailDesc.textContent = selectedTodo.desc || "No description provided.";

        if(selectedTodo.image){
            image_element.src = selectedTodo.image;
            image_element.style.display = 'block';
        } else{
            image_element.style.display = 'none';
        }
    }

    // 2. Form Submit: Create or Edit Task Object
    todoForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = taskTitleInput.value.trim();
        const desc = taskDescInput.value.trim();
        const dueDate = taskDateInput.value;
        const notifDue = taskNotifInput.value;

        if (!title) return;

        if (editingTaskId !== null) {
            // Edit existing task object
            const taskToEdit = todos.find((t) => t.id === editingTaskId);
            if (taskToEdit) {
                taskToEdit.title = title;
                taskToEdit.desc = desc;
                taskToEdit.dueDate = dueDate;
                taskToEdit.notifDue = notifDue;
                if(current_image_data){
                    taskToEdit.image = current_image_data;
                }

                const transaction = db.transaction(["tasks"], "readwrite");
                const store = transaction.objectStore("tasks");
                store.put(taskToEdit);
            }
            scheduleNotif(title, notifDue)
            resetFormState();
            startList();
            startDetail();
        } else {
            // Create new task object
            const newTask = { title, desc, dueDate, notifDue, image: current_image_data, completed: false };

            current_image_data = null;
            photoView.style.display = 'none';
            const transaction = db.transaction(["tasks"], "readwrite");
            const store = transaction.objectStore("tasks");
            const add_request = store.add(newTask)

            add_request.onsuccess = (event) => {
                newTask.id = event.target.result;
                todos.push(newTask);
                selectedTaskId = newTask.id;
                todoForm.reset()

                scheduleNotif(title, notifDue);
                resetFormState();
                startList();
                startDetail();
            }
        }
    });

    //stream video and get picture
    let streaming = false;
    let width = 400;
    let height = 0;
    let current_image_data = null;

    async function get_Stream() {
        return await navigator.mediaDevices.getUserMedia({
            video: true,
        })
    }
    function camera_Launch(stream){
        mediaStream = stream;
        video_element.srcObject = stream;
        video_element.play();
        capMedBtn.textContent = "Stop Capturing"
    }

    function stop_camera(){
        if(mediaStream){
            mediaStream.getTracks(). forEach((track) => track.stop())
            mediaStream = null;
        }

        video_element.srcObject = null;
        streaming = false;
        capMedBtn.textContent = "Capture Media";
    }

    async function init_Camera() {
        try {
            const stream = await get_Stream();
            camera_Launch(stream);
        } catch(err){
            console.error("Cam acces unavailable", err);
        }
    } init_Camera();

    video_element.addEventListener('canplay', (ev) =>{
        if(!streaming){
            height = video_element.videoHeight / (video_element.videoWidth / width);
            if(isNaN(height)){
                height = width / (4 / 3);
            }

            video_element.setAttribute('width', width);
            video_element.setAttribute('height', height);
            canvas_element.setAttribute('width', width);
            canvas_element.setAttribute('height', height);
            streaming = true;
        }
    }, false);

    capMedBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        if(mediaStream){ stop_camera() }
        else{ await init_Camera() }
    });

    function take_pic(){
        const context = canvas_element.getContext('2d');
        if(width && height){
            canvas_element.width = width;
            canvas_element.height = height;
            context.drawImage(video_element, 0, 0, width, height);
            current_image_data = canvas_element.toDataURL('image/png')
            

            //shows canvas
            photoView.src = current_image_data;
            photoView.style.display = 'block';
            return current_image_data;
        }
    }

    takePicBtn.addEventListener('click', (e) => {
        e.preventDefault();
        take_pic();
    });

    // 3. Edit Action
    editBtn.addEventListener("click", () => {
        const selectedTodo = todos.find((t) => t.id === selectedTaskId);
        if (!selectedTodo) return;

        editingTaskId = selectedTodo.id;
        taskTitleInput.value = selectedTodo.title;
        taskDescInput.value = selectedTodo.desc;
        taskDateInput.value = selectedTodo.dueDate === "Today" || selectedTodo.dueDate === "Tomorrow" ? "" : selectedTodo.dueDate;

        formHeading.textContent = "Edit Task";
        submitBtn.textContent = "Update Task";
        cancelEditBtn.style.display = "inline-block";
    });

    // Cancel Edit
    cancelEditBtn.addEventListener("click", resetFormState);

    function resetFormState() {
        editingTaskId = null;
        current_image_data = null;
        photoView.style.display = 'none';
        photoView.src = '';
        todoForm.reset();
        formHeading.textContent = "Create a New Task";
        submitBtn.textContent = "Add Task";
        cancelEditBtn.style.display = "none";
    }

    // 4. Delete Action
    deleteBtn.addEventListener("click", () => {
        if (selectedTaskId === null) return;

        const transaction = db.transaction(["tasks"], "readwrite");
        const store = transaction.objectStore("tasks");
        store.delete(selectedTaskId);

        todos = todos.filter((t) => t.id !== selectedTaskId);
        selectedTaskId = todos.length > 0 ? todos[0].id : null;

        if (editingTaskId) resetFormState();

        startList();
        startDetail();
    });
});