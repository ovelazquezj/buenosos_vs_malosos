import pytest
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5173')
API_URL = os.environ.get('API_URL', 'http://localhost:3001')
ARTIFACTS_DIR = os.environ.get('ARTIFACTS_DIR', os.path.join(os.path.dirname(__file__), 'artifacts'))
HEADLESS = os.environ.get('SELENIUM_HEADLESS', 'true').lower() == 'true'

@pytest.fixture(scope='session')
def driver():
    options = Options()
    if HEADLESS:
        options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1280,800')
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(10)
    yield driver
    driver.quit()

def screenshot(driver, name):
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    path = os.path.join(ARTIFACTS_DIR, f'{name}.png')
    driver.save_screenshot(path)
    return path
