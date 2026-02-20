from playwright.sync_api import sync_playwright

def verify_mute_button():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173")

            # Wait for content to load
            # page.wait_for_load_state("networkidle")
            # Networkidle might be flaky if game loop requests frames? No, frames are local.
            # But just waiting for selector is better.

            print("Waiting for MUTE button...")
            mute_btn = page.get_by_role("button", name="MUTE")
            mute_btn.wait_for(timeout=10000)
            print("Mute button found.")

            # Click it
            mute_btn.click()
            print("Clicked MUTE.")

            # Check for UNMUTE
            unmute_btn = page.get_by_role("button", name="UNMUTE")
            unmute_btn.wait_for(timeout=5000)
            print("Unmute button visible after click.")

            # Take screenshot
            page.screenshot(path="mute_verification.png")
            print("Screenshot saved to mute_verification.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_mute_button()
