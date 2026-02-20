export class InputHandler {
    isPressed: boolean = false;
    private element: HTMLElement;

    constructor(element: HTMLElement) {
        this.element = element;
        this.element.addEventListener('mousedown', this.handleStart);
        this.element.addEventListener('touchstart', this.handleStart, { passive: false });

        window.addEventListener('mouseup', this.handleEnd);
        window.addEventListener('touchend', this.handleEnd);
    }

    private handleStart = (e: Event) => {
        // Prevent default only for touch to stop scrolling/zooming
        if (e.type === 'touchstart') e.preventDefault();
        this.isPressed = true;
    }

    private handleEnd = () => {
        this.isPressed = false;
    }

    cleanup() {
        this.element.removeEventListener('mousedown', this.handleStart);
        this.element.removeEventListener('touchstart', this.handleStart);
        window.removeEventListener('mouseup', this.handleEnd);
        window.removeEventListener('touchend', this.handleEnd);
    }
}
