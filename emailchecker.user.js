// ==UserScript==
// @name         Google Email Validation
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  Validate Google workplace email accounts
// @author       hanaddi
// @match        https://hanaddi.github.io/google-email-checker/*
// @match        https://accounts.google.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @downloadURL  https://hanaddi.github.io/google-email-checker/emailchecker.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(async function () {
    'use strict';
    let data_all = [];
    const key_all_data = "emailCheckValid";
    const redirectUrl = "https://accounts.google.com/o/oauth2/auth?operation=login&state=google-|https://medium.com/?access_type=online&client_id=216296035834-k1k6qe060s2tp2a2jam4ljdcms00sttg.apps.googleusercontent.com&redirect_uri=https://medium.com/m/callback/google&response_type=id_token token&scope=email openid profile";

    function getObject(key) {
        try {
            return JSON.parse(GM_getValue(key));
        } catch (e) {
            return false;
        }
    }

    // https://hanaddi.github.io/google-email-checker
    if (window.location.href.includes('https://hanaddi.github.io/google-email-checker')) {
        data_all = getObject(key_all_data) || {emails:[], results:{}};

        document.body.innerHTML = "";
        const mainEl = document.createElement("div");
        mainEl.style.position = "fixed";
        mainEl.style.background = "seashell";
        mainEl.style.width = "100%";
        mainEl.style.height = "100%";
        mainEl.style.left = "0";
        mainEl.style.top = "0";
        mainEl.style.overflow = "auto";
        document.body.appendChild(mainEl);

        const inputEmails = document.createElement("textarea");
        inputEmails.style.width = "100vw";
        inputEmails.style.minHeight = "50px";
        inputEmails.style.resize = "vertical";
        mainEl.appendChild(inputEmails);
        const btninputEmails = document.createElement("button");
        btninputEmails.innerText = "LOAD";
        btninputEmails.style.margin = "5px 10px";
        mainEl.appendChild(btninputEmails);
        btninputEmails.onclick = ev => {
            let emails = inputEmails.value.split("\n").map(e => e.trim().toLowerCase()).filter(e => e);
            data_all.emails = emails;
            data_all.results = {};
            loadTable(data_all);
            GM_setValue(key_all_data, JSON.stringify(data_all));
        };

        const btnReload = document.createElement("button");
        btnReload.innerText = "Reload";
        mainEl.appendChild(btnReload);
        btnReload.onclick = ev => {
            data_all = getObject(key_all_data) || {emails:[], results:{}};
            loadTable(data_all);
        };

        const btnRun = document.createElement("a");
        btnRun.innerText = "RUN";
        btnRun.style.margin = "5px 10px";
        btnRun.target = "_blank";
        btnRun.href = redirectUrl;
        mainEl.appendChild(btnRun);

        const btnDownload = document.createElement("button");
        btnDownload.innerText = "DOWNLOAD";
        btnDownload.style.margin = "5px 10px";
        mainEl.appendChild(btnDownload);
        btnDownload.onclick = ev => {
            const data = [];
            data.push(["name", "status"]);
            for (let email of data_all.emails) {
                data.push([email, data_all.results[email] ?? "-"]);
            }
            const csvContent = data.map(row => row.join(",")).join("\n");
            const base64CSV = btoa(unescape(encodeURIComponent(csvContent)));
            const dataUrl = `data:text/csv;base64,${base64CSV}`;
            const a = document.createElement("a");
            a.href = dataUrl;
            const now = Date.now();
            a.download = `emails_${now}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        const tableEl = document.createElement("table");
        mainEl.appendChild(tableEl);
        function loadTable(data) {
            tableEl.innerHTML = "";
            const thr = document.createElement("tr");
            let th = document.createElement("th"); th.innerHTML = "No."; thr.appendChild(th);
            th = document.createElement("th"); th.innerHTML = "Email"; thr.appendChild(th);
            th = document.createElement("th"); th.innerHTML = "Status"; thr.appendChild(th);
            tableEl.appendChild(thr);
            let i = 1;
            for (let email of data.emails) {
                const thr = document.createElement("tr");
                let th = document.createElement("td"); th.innerHTML = i; thr.appendChild(th);
                th = document.createElement("td"); th.innerHTML = email; thr.appendChild(th);
                th = document.createElement("td"); th.innerHTML = data.results[email] ?? "-"; thr.appendChild(th);
                tableEl.appendChild(thr);
                i++;
            }
        }
        loadTable(data_all);
        return;
    }

    if (window.location.href.includes('https://accounts.google.com/v3/signin/identifier')) {

        data_all = getObject(key_all_data)  || {emails:[], results:{}};

        let email = null;
        for (let e of data_all.emails) {
            if (!data_all.results[e]) {
                email = e;
                break;
            }
        }

        if (!email) {
            return;
        }

        function tryPutEmail(email) {
            try {
                document.querySelector("#identifierId").value = email;
                [...document.querySelectorAll("button")].find(e => e.innerText.includes("Next")).click();
                tryValidateEmail();
            } catch (e) {
                console.error(e);
                window.setTimeout(tryPutEmail, email, 1000);
            }
        }
        window.setTimeout(w => tryPutEmail(email), 100);

        function tryValidateEmail() {
            try {
                let url = window.location.href;
                if (url.includes("https://accounts.google.com/v3/signin/identifier")) {
                    throw "not ready";
                }
                if (url.includes("https://accounts.google.com/v3/signin/deletedaccount")) {
                    data_all.results[email] = "deleted";
                    GM_setValue(key_all_data, JSON.stringify(data_all));
                    window.setTimeout(w => {
                        window.location = redirectUrl;
                    }, 1000);
                }
                if (url.includes("https://accounts.google.com/v3/signin/challenge/pwd")) {
                    data_all.results[email] = "valid";
                    GM_setValue(key_all_data, JSON.stringify(data_all));
                    window.setTimeout(w => {
                        window.location = redirectUrl;
                    }, 1000);
                }
                if (url.includes("https://accounts.google.com/v3/signin/challenge/recaptcha")) {
                    data_all.results[email] = "captcha";
                    GM_setValue(key_all_data, JSON.stringify(data_all));
                    window.setTimeout(w => {
                        window.location = redirectUrl;
                    }, 1000);
                }
                console.log("URL", url);
            } catch (e) {
                console.error(e);
                window.setTimeout(tryValidateEmail, 1000);
            }
        }

        return;
    }

    if (window.location.href.includes('https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount')) {
    }
})();



