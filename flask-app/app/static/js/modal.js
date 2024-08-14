// Получаем модальное окно
var modal = document.getElementById("card-modal");

// Получаем элемент для отображения контента
var modalBody = document.getElementById("card-modal-body");

// Получаем кнопку для закрытия модального окна
var span = document.getElementById("card-modal-close");


function setModalContent(innerHTML) {
    modalBody.innerHTML = innerHTML;
}

function showModal() {
    modal.style.display = "block";
}

// Когда пользователь нажимает на <span> (x), закрыть окно
span.onclick = function() {
    modal.style.display = "none";
}

// Когда пользователь нажимает в любом месте за пределами модального окна, закрыть его
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Когда пользователь нажимает клавишу Escape, закрыть окно
document.onkeydown = function(event) {
    if (event.key === "Escape") {
        modal.style.display = "none";
    }
}
