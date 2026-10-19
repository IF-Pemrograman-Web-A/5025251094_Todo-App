<?php 
require_once 'includes/config.php';
include 'includes/menu-bar.php'; 

// CREATE
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create') {
    $title    = trim($_POST['title']);
    $assignee = trim($_POST['assignee']);
    $desc     = trim($_POST['description']);
    $dueDate  = $_POST['dueDate'] ?: null;

    if (!empty($title) && !empty($assignee)) {
        $stmt = $conn->prepare("INSERT INTO team_tasks (title, assignee, description, due_date) VALUES (:t, :a, :d, :date)");
        $stmt->execute([':t' => $title, ':a' => $assignee, ':d' => $desc, ':date' => $dueDate]);
        header("Location: team.php");
        exit;
    }
}

// UPDATE
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update') {
    $id       = (int)$_POST['task_id'];
    $title    = trim($_POST['title']);
    $assignee = trim($_POST['assignee']);
    $desc     = trim($_POST['description']);
    $dueDate  = $_POST['dueDate'] ?: null;

    if ($id > 0 && !empty($title) && !empty($assignee)) {
        $stmt = $conn->prepare("UPDATE team_tasks SET title = :t, assignee = :a, description = :d, due_date = :date WHERE id = :id");
        $stmt->execute([':t' => $title, ':a' => $assignee, ':d' => $desc, ':date' => $dueDate, ':id' => $id]);
        header("Location: team.php");
        exit;
    }
}

// DELETE
if (isset($_GET['delete_id'])) {
    $deleteId = (int)$_GET['delete_id'];
    if ($deleteId > 0) {
        $stmt = $conn->prepare("DELETE FROM team_tasks WHERE id = :id");
        $stmt->execute([':id' => $deleteId]);
        header("Location: team.php");
        exit;
    }
}

// EDIT FETCH
$editTask = null;
if (isset($_GET['edit_id'])) {
    $stmt = $conn->prepare("SELECT * FROM team_tasks WHERE id = :id");
    $stmt->execute([':id' => (int)$_GET['edit_id']]);
    $editTask = $stmt->fetch(PDO::FETCH_ASSOC);
}

// READ
$stmt = $conn->prepare("SELECT * FROM team_tasks ORDER BY created_at DESC");
$stmt->execute();
$teamTasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<main class="layoutContainer">
    <section class="todoPanel">
        <h2>Shared / Team Tasks</h2>
        <ul class="list">
            <?php if (empty($teamTasks)): ?>
                <p>No shared tasks available.</p>
            <?php else: ?>
                <?php foreach ($teamTasks as $task): ?>
                    <li class="todoItem" style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="taskContent">
                            <h3><?= htmlspecialchars($task['title']) ?></h3>
                            <p><strong>Assigned:</strong> <?= htmlspecialchars($task['assignee']) ?> | <strong>Due:</strong> <?= $task['due_date'] ?: 'None' ?></p>
                            <p><?= htmlspecialchars($task['description']) ?></p>
                        </div>
                        <div class="actionButtons">
                            <a href="team.php?edit_id=<?= $task['id'] ?>" class="actionBtn editBtn" style="text-decoration:none;">Edit</a>
                            <a href="team.php?delete_id=<?= $task['id'] ?>" class="actionBtn deleteBtn" style="text-decoration:none;" onclick="return confirm('Delete task?');">Delete</a>
                        </div>
                    </li>
                <?php endforeach; ?>
            <?php endif; ?>
        </ul>
    </section>

    <aside class="detailPanel">
        <h2><?= $editTask ? 'Edit Task' : 'Assign Team Task' ?></h2>
        <form class="todoDetail" action="team.php" method="POST">
            <input type="hidden" name="action" value="<?= $editTask ? 'update' : 'create' ?>">
            <?php if ($editTask): ?>
                <input type="hidden" name="task_id" value="<?= $editTask['id'] ?>">
            <?php endif; ?>

            <div class="taskGroup">
                <label for="title">Title</label>
                <input type="text" name="title" value="<?= $editTask ? htmlspecialchars($editTask['title']) : '' ?>" required>
            </div>
            <div class="taskGroup">
                <label for="assignee">Assignee</label>
                <input type="text" name="assignee" value="<?= $editTask ? htmlspecialchars($editTask['assignee']) : '' ?>" required>
            </div>
            <div class="taskGroup">
                <label for="description">Description</label>
                <textarea name="description" rows="3"><?= $editTask ? htmlspecialchars($editTask['description']) : '' ?></textarea>
            </div>
            <div class="taskGroup">
                <label for="dueDate">Due Date</label>
                <input type="date" name="dueDate" value="<?= $editTask ? $editTask['due_date'] : '' ?>">
            </div>

            <button type="submit" class="submitButton"><?= $editTask ? 'Update Task' : 'Assign Task' ?></button>
            <?php if ($editTask): ?>
                <a href="team.php" style="display:block; text-align:center; margin-top:8px;">Cancel Edit</a>
            <?php endif; ?>
        </form>
    </aside>
</main>

<?php include 'includes/footer.php'; ?>