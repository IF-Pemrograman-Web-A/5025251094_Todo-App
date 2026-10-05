self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SCHEDULE_NOTIFICATION") {
        const { title, body, delay } = event.data;

        event.waitUntil(
            new Promise((resolve) => {
                setTimeout(() => {
                    self.registration.showNotification(title, { body: body });
                    resolve();
                }, delay);
            })
        );
    }
});