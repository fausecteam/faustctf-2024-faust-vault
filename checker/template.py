#!/usr/bin/env python3

from ctf_gameserver import checkerlib

from selenium import webdriver
import selenium.common.exceptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.chrome.options import Options

import secrets
import logging
import tempfile
import os
import random
import string
import requests
import time

chrome_options = Options()
chrome_options.add_argument("--headless")

chrome_options.timeouts = {'script': 10000, 'pageLoad': 100000}

PORT = 5555


def randuser():
    return secrets.token_hex(secrets.randbelow(5) + 4)


class TemplateChecker(checkerlib.BaseChecker):

    def new_session(self):
        logging.info("Creating selenium session...")
        driver = webdriver.Chrome(options=chrome_options)
        logging.info("Driver created")
        try:
            logging.info("loading page initially...")
            driver.get(self.endpoint("/"))
            logging.info("initial page load done")

            return driver
        except selenium.common.exceptions.TimeoutException:
            logging.exception("new_session")
            driver.close()
            driver.quit()
            raise
        except selenium.common.exceptions.WebDriverException:
            logging.exception("new_session")
            driver.close()
            driver.quit()
            raise

    def endpoint(self, path):
        return f"http://[{self.ip}]:{PORT}/" + path

    def register(self, driver, user, password):
        logging.info(f"Registering user {user}")

        # Click on register page link
        WebDriverWait(driver, 10, 1).until(lambda driver: driver.find_element(By.CSS_SELECTOR, '[href="/register"]'))
        driver.find_element(By.CSS_SELECTOR, '[href="/register"]').click()

        # Wait for full page load
        WebDriverWait(driver, 10, 1).until(lambda driver: driver.find_element(By.ID, 'username'))

        # fill the input fields
        driver.find_element(By.ID, 'username').send_keys(user)
        driver.find_element(By.ID, 'password').send_keys(password)
        driver.find_element(By.ID, 'repeat_password').send_keys(password)

        # Submit the form
        driver.find_element(By.CSS_SELECTOR, '[type="submit"]').click()

        # Wait until we're on the login page
        WebDriverWait(driver, 10, 1).until(lambda driver: driver.current_url.endswith('/login'))

    def login(self, driver, user, password):
        logging.info(f"Logging in as user {user}")

        # Wait for full page load
        WebDriverWait(driver, 10, 1).until(lambda driver: driver.find_element(By.ID, 'username'))

        # fill the input fields
        driver.find_element(By.ID, 'username').send_keys(user)
        driver.find_element(By.ID, 'password').send_keys(password)

        # Submit the form
        driver.find_element(By.CSS_SELECTOR, '[type="submit"]').click()

        # Wait until we're on the secrets page
        WebDriverWait(driver, 10, 1).until(lambda driver: driver.current_url.endswith('/secrets'))

    def place_flag(self, tick):
        driver = None
        try:
            driver = self.new_session()

            # login using username and password
            username = randuser()
            password = randuser()
            checkerlib.store_state(f'flaguser{tick}', username)
            checkerlib.store_state(f'password{tick}', password)
            logging.info(f'flaguser: {username}')
            logging.info(f'password: {password}')
            self.register(driver, username, password)
            logging.info(f'Finished registering user.')

            self.login(driver, username, password)

            # Wait for full page load
            WebDriverWait(driver, 10, 1).until(lambda driver: driver.find_elements(By.CSS_SELECTOR, '[type="button"]'))

            # Click the add button
            driver.find_elements(By.CSS_SELECTOR, '[type="button"]')[1].click()

            # Fill input fields
            WebDriverWait(driver, 10, 1).until(lambda driver: driver.find_element(By.ID, 'key'))
            driver.find_element(By.ID, "key").send_keys("flag")
            driver.find_element(By.ID, "value").send_keys(checkerlib.get_flag(tick))

            checkerlib.set_flagid(username)

            # Submit the form
            driver.find_element(By.CSS_SELECTOR, '[type="submit"]').click()

            WebDriverWait(driver, 10, 1).until(lambda driver: driver.find_elements(By.CSS_SELECTOR, 'td'))

            return checkerlib.CheckResult.OK
        except selenium.common.exceptions.TimeoutException:
            logging.exception("place-flag")
            return checkerlib.CheckResult.DOWN
        except selenium.common.exceptions.WebDriverException:
            logging.exception("place-flag")
            return checkerlib.CheckResult.DOWN
        except selenium.common.exceptions.UnexpectedAlertPresentException:
            logging.exception("place-flag")
            return checkerlib.CheckResult.FAULTY
        finally:
            try:
                if driver:
                    driver.close()
                    driver.quit()
            except:
                logging.exception("place-flag")
                return checkerlib.CheckResult.FAULTY

    def check_service(self):
        username = randuser()
        print(username)
        date = int(time.time())
        print(date)
        master_key = ''.join(random.choice(string.hexdigits.lower()[:16]) for _ in range(1024))
        e = ''.join(random.choice(string.hexdigits.lower()[:16]) for _ in range(1024))
        n = "1d7561ee12f50903646be0ca8d61c7c488e849552d516ec63cba1fc310eb296dddb519c4874734892eb7b2d55c9c03cb61ece675528881ac86f2cc6d9e571244ccebcb6a164293c3da21278eb3ceabb019c48f6b38a3d2afc8c048af2da983987a4300922694027b30892709fb713b35ba89a7dd41b37be52c3829c3a4311e7bd3e2116c8bf58523b533685ebab66275d6d3603e5ebca7d9d2b530fb18ea87b3155cf410b807513c581fcf9134c90d18c6499da06742e774c4b5b28e15ac6d29ee5d9f4b1ea66c8a7690145f9e3cf194bec1c939c431e9a1f6c55144fdbf2a97b0422580cd5f1da9c90e480eb67e90e765ef79b43860a1f454216043b08f9fa32b403e14b4b73a7e1e7fe24b4b31b315fca5458a10868c553b56e4f613f7380685ac0f040ff741dad05cb3373279752b6675432ba688472f5ca4d2ee63d4656eab8a2f821ef747eb7f22a3a8818418da65763e10f297233ebd16665e66e00bf024954a45c4438add6562665678a8c2c3da4e828a93b363e39873bf7df650a77c1d37c38d241a72e298da164d993feee39bb2b922c6879ffca8bdc764fce00e965081900299d96826c48ed2464fb4342c9efc78c7638d2c704e8d1b3efcb5b454f1b49a84a5cc8c5cfee73c49c1d3a00509b6520d1b07e7d78362e8604ce5a940f909f8dc33a05317d626e0963385d42f480461f6d5ddc73232d8317046e6d29c"

        # register user
        r = requests.post(self.endpoint(f"api/store/{username}/"), json={"key": "master-key", "value": master_key})
        if r.status_code != 200:
            print(r.text)
            return checkerlib.CheckResult.FAULTY
        print("master-key stored")
        r = requests.post(self.endpoint(f"api/store/{username}/"), json={"key": "e", "value": e})
        if r.status_code != 200:
            print(r)
            return checkerlib.CheckResult.FAULTY
        
        print("e stored")
        r = requests.post(self.endpoint(f"api/store/{username}/"), json={"key": "n", "value": n})
        if r.status_code != 200:
            print(r)
            return checkerlib.CheckResult.FAULTY
        
        print("n stored")

        # login user
        r = requests.get(self.endpoint(f"api/store/{username}/master-key"))
        if (r.status_code != 200 or r.json()["value"] != master_key):
            print(r)
            return checkerlib.CheckResult.FAULTY
        
        print("master-key ok")
        r = requests.get(self.endpoint(f"api/store/{username}/e"))
        if (r.status_code != 200 or r.json()["value"] != e):
            print(r)
            return checkerlib.CheckResult.FAULTY
        
        print("e ok")
        r = requests.get(self.endpoint(f"api/store/{username}/n"))
        if (r.status_code != 200 or r.json()["value"] != n):
            print(r)
            return checkerlib.CheckResult.FAULTY
        
        print("n ok")

        # retrieve registry date/time
        r = requests.get(self.endpoint(f"api/store/"))
        if (r.status_code != 200):
            print(r)
            return checkerlib.CheckResult.FAULTY
        found = False
        for user in r.json():
            if user["group"] == username:
                if (date - user["createdAt"]) < 10:
                    found = True
                break
        
        if not found:
            print("user not found at all")
            return checkerlib.CheckResult.FAULTY
        
        return checkerlib.CheckResult.OK


    def check_flag(self, tick):
        driver = None
        try:
            username = checkerlib.load_state(f'flaguser{tick}')
            password = checkerlib.load_state(f'password{tick}')
            if username is None:
                logging.warning("Missing flaguser in state")
                return checkerlib.CheckResult.FLAG_NOT_FOUND
            if password is None:
                logging.warning("Missing password in state")
                return checkerlib.CheckResult.FLAG_NOT_FOUND

            driver = self.new_session()
            flag = checkerlib.get_flag(tick)

            # login using username and password
            self.login(driver, username, password)

            # Wait for full page load
            WebDriverWait(driver, 10, 1).until(lambda driver: driver.find_elements(By.CSS_SELECTOR, 'td'))

            # download flag
            if not any(element.text.strip() == flag for element in driver.find_elements(By.CSS_SELECTOR, 'td')):
                return checkerlib.CheckResult.FLAG_NOT_FOUND

            # decrypt flag

            return checkerlib.CheckResult.OK
        except selenium.common.exceptions.TimeoutException:
            logging.exception("check-flag")
            return checkerlib.CheckResult.FLAG_NOT_FOUND
        except selenium.common.exceptions.WebDriverException:
            logging.exception("check-flag")
            return checkerlib.CheckResult.FLAG_NOT_FOUND
        except selenium.common.exceptions.UnexpectedAlertPresentException:
            logging.exception("place-flag")
            return checkerlib.CheckResult.FLAG_NOT_FOUND
        finally:
            try:
                if driver:
                    driver.close()
                    driver.quit()
            except:
                logging.exception("place-flag")
                return checkerlib.CheckResult.FLAG_NOT_FOUND



if __name__ == '__main__':

    with tempfile.TemporaryDirectory() as tmp:
        os.environ['HOME'] = tmp
        checkerlib.run_check(TemplateChecker)
