class Modal {
    constructor(modal_id, modal_body_id, modal_close_id, on_close_callback) {
        // Получаем модальное окно
        this.modal = document.getElementById(modal_id);

        // Получаем элемент для отображения контента
        this.modal_body = document.getElementById(modal_body_id);

        // Получаем кнопку для закрытия модального окна
        this.close_span = document.getElementById(modal_close_id);

        this.on_close_callback = on_close_callback;

        // Когда пользователь нажимает на <span> (x), закрыть окно
        this.close_span.onclick = () => {
            this.closeModal();
        }

        // Когда пользователь нажимает в любом месте за пределами модального окна, закрыть его
        window.onclick = (event) => {
            if (event.target == this.modal) {
                this.closeModal();
            }
        }

        // Когда пользователь нажимает клавишу Escape, закрыть окно
        document.onkeydown = (event) => {
            if (event.key === "Escape") {
                this.closeModal();
            }
        }
    }

    setModalContent(innerHTML) {
        this.modal_body.innerHTML = innerHTML;
    }
    
    showModal() {
        this.modal.style.display = "block";
        document.body.classList.add('modal-open');
    }
    
    closeModal() {
        this.modal.style.display = "none";
        document.body.classList.remove('modal-open');
        if (this.on_close_callback) this.on_close_callback();
    }
}
