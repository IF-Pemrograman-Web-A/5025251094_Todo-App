<?php 
require_once 'includes/config.php';
include 'includes/menu-bar.php'; 

// 1. CREATE TASK
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create') {
    $title     = trim($_POST['title']);
    $desc      = trim($_POST['description']);
    $dueDate   = $_POST['dueDate'] ?: null;
    $reminder  = $_POST['reminderDate'] ?: null;
    $imageData = $_POST['image_data'] ?: null;

    if (!empty($title)) {
        $stmt = $conn->prepare("INSERT INTO personal_tasks (title, description, due_date, reminder_date, image_data) VALUES (:t, :d, :due, :rem, :img)");
        $stmt->execute([
            ':t'   => $title, 
            ':d'   => $desc, 
            ':due' => $dueDate, 
            ':rem' => $reminder,
            ':img' => $imageData
        ]);
        header("Location: index.php");
        exit;
    }
}

// 2. UPDATE TASK
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update') {
    $id        = (int)$_POST['task_id'];
    $title     = trim($_POST['title']);
    $desc      = trim($_POST['description']);
    $dueDate   = $_POST['dueDate'] ?: null;
    $reminder  = $_POST['reminderDate'] ?: null;
    $imageData = $_POST['image_data'] ?: null;

    if ($id > 0 && !empty($title)) {
        if (!empty($imageData)) {
            // Update with new image
            $stmt = $conn->prepare("UPDATE personal_tasks SET title = :t, description = :d, due_date = :due, reminder_date = :rem, image_data = :img WHERE id = :id");
            $stmt->execute([':t' => $title, ':d' => $desc, ':due' => $dueDate, ':rem' => $reminder, ':img' => $imageData, ':id' => $id]);
        } else {
            // Keep existing image
            $stmt = $conn->prepare("UPDATE personal_tasks SET title = :t, description = :d, due_date = :due, reminder_date = :rem WHERE id = :id");
            $stmt->execute([':t' => $title, ':d' => $desc, ':due' => $dueDate, ':rem' => $reminder, ':id' => $id]);
        }
        header("Location: index.php");
        exit;
    }
}

// 3. TOGGLE COMPLETED
if (isset($_GET['toggle_id'])) {
    $stmt = $conn->prepare("UPDATE personal_tasks SET completed = NOT completed WHERE id = :id");
    $stmt->execute([':id' => (int)$_GET['toggle_id']]);
    header("Location: index.php");
    exit;
}

// 4. DELETE TASK
if (isset($_GET['delete_id'])) {
    $stmt = $conn->prepare("DELETE FROM personal_tasks WHERE id = :id");
    $stmt->execute([':id' => (int)$_GET['delete_id']]);
    header("Location: index.php");
    exit;
}

// 5. FETCH TASK TO EDIT
$editTask = null;
if (isset($_GET['edit_id'])) {
    $stmt = $conn->prepare("SELECT * FROM personal_tasks WHERE id = :id");
    $stmt->execute([':id' => (int)$_GET['edit_id']]);
    $editTask = $stmt->fetch(PDO::FETCH_ASSOC);
}

// 6. READ ALL TASKS
$stmt = $conn->prepare("SELECT * FROM personal_tasks ORDER BY created_at DESC");
$stmt->execute();
$personalTasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<main class="layoutContainer">
    <!-- Left Task List Panel -->
    <section class="todoPanel">
        <h2>My Personal Tasks</h2>
        <ul class="list">
            <?php if (empty($personalTasks)): ?>
                <p>No personal tasks found. Add one using the form!</p>
            <?php else: ?>
                <?php foreach ($personalTasks as $task): ?>
                    <li class="todoItem <?= $task['completed'] ? 'completed' : '' ?>" style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="display:flex; gap:10px; align-items:flex-start;">
                            <input type="checkbox" <?= $task['completed'] ? 'checked' : '' ?> onclick="window.location.href='index.php?toggle_id=<?= $task['id'] ?>'">
                            <div class="taskContent">
                                <h3><?= htmlspecialchars($task['title']) ?></h3>
                                <p><strong>Due:</strong> <?= $task['due_date'] ?: 'No date' ?> | <strong>Status:</strong> <?= $task['completed'] ? 'Completed' : 'Pending' ?></p>
                                <?php if (!empty($task['description'])): ?>
                                    <p style="margin-top:4px;"><?= htmlspecialchars($task['description']) ?></p>
                                <?php endif; ?>
                                <?php if (!empty($task['image_data'])): ?>
                                    <img src="<?= $task['image_data'] ?>" alt="Attachment" style="max-width:100%; max-height:150px; border-radius:6px; margin-top:8px;">
                                <?php endif; ?>
                            </div>
                        </div>
                        <div class="actionButtons">
                            <a href="index.php?edit_id=<?= $task['id'] ?>" class="actionBtn editBtn" style="text-decoration:none;">Edit</a>
                            <a href="index.php?delete_id=<?= $task['id'] ?>" class="actionBtn deleteBtn" style="text-decoration:none;" onclick="return confirm('Delete task?');">Delete</a>
                        </div>
                    </li>
                <?php endforeach; ?>
            <?php endif; ?>
        </ul>
    </section>

    <!-- Right Form Panel -->
    <aside class="detailPanel">
        <h2><?= $editTask ? 'Edit Personal Task' : 'Create Personal Task' ?></h2>
        
        <form class="todoDetail" action="index.php" method="POST" id="todoForm">
            <input type="hidden" name="action" value="<?= $editTask ? 'update' : 'create' ?>">
            <?php if ($editTask): ?>
                <input type="hidden" name="task_id" value="<?= $editTask['id'] ?>">
            <?php endif; ?>

            <!-- Hidden input to store captured image base64 -->
            <input type="hidden" id="imageDataInput" name="image_data" value="">

            <div class="taskGroup">
                <label for="taskTitle">Title</label>
                <input type="text" id="taskTitle" name="title" value="<?= $editTask ? htmlspecialchars($editTask['title']) : '' ?>" placeholder="Enter title..." required>
            </div>

            <div class="taskGroup">
                <label for="taskDesc">Description</label>
                <textarea id="taskDesc" name="description" rows="3" placeholder="Enter details..."><?= $editTask ? htmlspecialchars($editTask['description']) : '' ?></textarea>
            </div>

            <div class="taskGroup">
                <label for="taskDate">Due date</label>
                <input type="date" id="taskDate" name="dueDate" value="<?= $editTask ? $editTask['due_date'] : '' ?>">
            </div>

            <div class="taskGroup">
                <label for="reminderDate">Reminder</label>
                <input type="datetime-local" id="reminderDate" name="reminderDate" value="<?= $editTask ? $editTask['reminder_date'] : '' ?>">
            </div>

            <!-- Image / Camera Attachment Area -->
            <div class="imageAttachment">
                <video id="videoElm" autoplay playsinline style="width: 100%; max-width: 400px; background:#222; border-radius:6px;"></video>
                <canvas id="canvasElm" style="display: none;"></canvas>
                <div style="display:flex; gap:8px; margin-top:8px;">
                    <button type="button" id="camera-Video">Start Camera</button>
                    <button type="button" id="take-picture">Take Photo</button>
                </div>
                <img class="captured-img" id="photoPreview" src="<?= ($editTask && !empty($editTask['image_data'])) ? $editTask['image_data'] : '' ?>" style="<?= ($editTask && !empty($editTask['image_data'])) ? 'display:block;' : 'display:none;' ?> max-width:100%; border-radius:6px; margin-top:10px;"/>
            </div>

            <button type="submit" id="submitBtn" class="submitButton"><?= $editTask ? 'Update Task' : 'Add Task' ?></button>
            <?php if ($editTask): ?>
                <a href="index.php" class="cancelButton" style="display:block; text-align:center; text-decoration:none; margin-top:8px;">Cancel Edit</a>
            <?php endif; ?>
        </form>
    </aside>
</main>

<?php include 'includes/footer.php'; ?>