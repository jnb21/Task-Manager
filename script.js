const addTaskBtn = document.getElementById("add-task-btn");
const taskList = document.getElementById("task-list");

addTaskBtn.addEventListener("click", () => {
    console.log("clicked");

    const taskName = prompt("Enter task:");

    if (!taskName) return;

    const taskCard = document.createElement("div");
    taskCard.classList.add("task-card");

    taskCard.innerHTML = `<h3>${taskName}</h3>`;

    taskList.appendChild(taskCard);
});