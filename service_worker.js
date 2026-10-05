self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SCHEDULE_NOTIFICATION"){
        setTimeout(() => {
            self.registration.showNotification(event.data.title, {
                body: event.data.body
            });
        }, event.data.delay);
    }
});