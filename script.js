const addTaskBtn = document.getElementById("add-task-btn");
const taskList = document.getElementById("task-list");

addTaskBtn.addEventListener("click", () => {

    // task title
    const taskName = prompt("Enter task:");

    if (!taskName || taskName.trim() === "") return;

    // task priority
    const priority = prompt(
        "Choose priority: Low, Medium, or High"
    );

    if (!priority) return;

    // create task card
    const taskCard = document.createElement("div");

    taskCard.classList.add("task-card");

    // add priority color class
    taskCard.classList.add(priority.toLowerCase());

    taskCard.innerHTML = `
        <h3>${taskName}</h3>
        <p>Priority: ${priority}</p>
    `;

    taskList.appendChild(taskCard);
});