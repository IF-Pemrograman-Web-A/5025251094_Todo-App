let mediaStream = null;

document.addEventListener("DOMContentLoaded", () => {
    let service_Worker_Registration = null;

    if ("serviceWorker" in navigator && "Notification" in window) {
        navigator.serviceWorker.register("service_worker.js").then((reg) => {
            service_Worker_Registration = reg;
            console.log("Service worker registered!");
        }).catch((err) => {
            console.error("Service worker failed:", err);
        });

        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }

    function scheduleNotif(title, reminderTimeStr) {
        if (!reminderTimeStr) return;
        const delay = new Date(reminderTimeStr).getTime() - Date.now();

        if (delay > 0 && Notification.permission === "granted") {
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


    const todoForm = document.getElementById("todoForm");
    if (todoForm) {
        todoForm.addEventListener("submit", () => {
            const titleInput = document.getElementById("taskTitle");
            const reminderInput = document.getElementById("reminderDate");
            if (titleInput && reminderInput) {
                scheduleNotif(titleInput.value, reminderInput.value);
            }
        });
    }

    const themeToggleBtn = document.getElementById("modeToggle");
    const saved_theme = localStorage.getItem("theme");
    if (saved_theme === "dark") {
        document.body.classList.add("dark-mode");
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            const isDark = document.body.classList.contains("dark-mode");
            localStorage.setItem("theme", isDark ? "dark" : "light");
        });
    }

    const video_element = document.getElementById("videoElm");
    const canvas_element = document.getElementById("canvasElm");
    const capMedBtn = document.getElementById("camera-Video");
    const takePicBtn = document.getElementById("take-picture");
    const photoView = document.getElementById("photoPreview");
    const imageDataInput = document.getElementById("imageDataInput");

    if (video_element && capMedBtn && takePicBtn) {
        let streaming = false;
        let width = 400;
        let height = 0;

        async function get_Stream() {
            return await navigator.mediaDevices.getUserMedia({ video: true });
        }

        function camera_Launch(stream) {
            mediaStream = stream;
            video_element.srcObject = stream;
            video_element.play();
            capMedBtn.textContent = "Stop Capturing";
        }

        function stop_camera() {
            if (mediaStream) {
                mediaStream.getTracks().forEach((track) => track.stop());
                mediaStream = null;
            }
            video_element.srcObject = null;
            streaming = false;
            capMedBtn.textContent = "Start Camera";
        }

        video_element.addEventListener('canplay', () => {
            if (!streaming) {
                height = video_element.videoHeight / (video_element.videoWidth / width);
                if (isNaN(height)) height = width / (4 / 3);

                video_element.setAttribute('width', width);
                video_element.setAttribute('height', height);
                canvas_element.setAttribute('width', width);
                canvas_element.setAttribute('height', height);
                streaming = true;
            }
        }, false);

        capMedBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (mediaStream) {
                stop_camera();
            } else {
                try {
                    const stream = await get_Stream();
                    camera_Launch(stream);
                } catch (err) {
                    console.error("Cam access unavailable", err);
                }
            }
        });

        takePicBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const context = canvas_element.getContext('2d');
            if (width && height) {
                canvas_element.width = width;
                canvas_element.height = height;
                context.drawImage(video_element, 0, 0, width, height);
                
                const current_image_data = canvas_element.toDataURL('image/png');
                
                // Set into hidden field for PHP submit + preview
                if (imageDataInput) imageDataInput.value = current_image_data;
                if (photoView) {
                    photoView.src = current_image_data;
                    photoView.style.display = 'block';
                }
            }
        });
    }
});