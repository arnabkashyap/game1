import sys
import time
from playwright.sync_api import sync_playwright

def test_game_launch():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Capture console logs
        page.on('console', lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        page.on('pageerror', lambda err: print(f"BROWSER ERROR: {err}"))
        
        # Navigate to the game
        print("Navigating to game...")
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        
        # Check title
        title = page.title()
        print(f"Page title: {title}")
        assert "Escape Road 3D" in title
        
        # Check if Main Menu is visible
        print("Checking Main Menu...")
        assert page.is_visible('#main-menu')
        
        # Go to Garage
        print("Opening Garage...")
        page.wait_for_selector('#to-garage-btn')
        page.click('#to-garage-btn')
        
        # Wait for garage window to be visible
        print("Waiting for Garage Window...")
        page.wait_for_selector('#garage-window', state='visible')
        
        # Start game
        print("Starting game...")
        page.wait_for_selector('#start-btn')
        page.click('#start-btn')
        
        # Wait for countdown
        print("Waiting for Countdown...")
        page.wait_for_selector('#countdown', state='visible')
        
        # Wait for HUD to become active
        print("Waiting for HUD...")
        page.wait_for_selector('#hud', state='visible', timeout=15000)
        
        # Verify distance increments
        time.sleep(2)
        d1_text = page.inner_text('#distance-val')
        print(f"Distance 1: {d1_text}")
        time.sleep(2)
        d2_text = page.inner_text('#distance-val')
        print(f"Distance 2: {d2_text}")
        
        d1 = int(d1_text.replace('m', ''))
        d2 = int(d2_text.replace('m', ''))
        
        assert d2 > d1
        print("Distance is incrementing. Gameplay is active.")
        
        browser.close()
        print("E2E Test Passed!")

if __name__ == "__main__":
    try:
        test_game_launch()
    except Exception as e:
        print(f"E2E Test Failed: {e}")
        # Take a screenshot on failure
        # page.screenshot(path='failure.png') # Can't easily view this here
        sys.exit(1)
