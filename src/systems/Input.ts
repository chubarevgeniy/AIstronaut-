export class InputHandler {
    isPressed: boolean = false;
    private element: HTMLElement;
    private isAttached: boolean = false;

    constructor(element: HTMLElement) {
        this.element = element;
        this.attach();
    }

    private handleStart = (e: Event) => {
        // Prevent default only for touch to stop scrolling/zooming
        if (e.type === 'touchstart') e.preventDefault();
        this.isPressed = true;
    }

    private handleEnd = () => {
        this.isPressed = false;
    }

    attach() {
        if (this.isAttached) return;
        this.element.addEventListener('mousedown', this.handleStart);
        this.element.addEventListener('touchstart', this.handleStart, { passive: false });

        window.addEventListener('mouseup', this.handleEnd);
        window.addEventListener('touchend', this.handleEnd);
        this.isAttached = true;
    }

    detach() {
        if (!this.isAttached) return;
        this.element.removeEventListener('mousedown', this.handleStart);
        this.element.removeEventListener('touchstart', this.handleStart);
        window.removeEventListener('mouseup', this.handleEnd);
        window.removeEventListener('touchend', this.handleEnd);
        this.isAttached = false;
    }

    // Alias for backward compatibility if needed, but we will update GameLoop
    cleanup() {
        this.detach();
    }
}
