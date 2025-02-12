
const options = {
    apikey: "1583819b-9792-43c4-b8bf-0b9fd2e239ae",
    endpoints: {
        page : window.location.origin+ "/poc/storage/index.html",
        session: "https://account.devmayank.com/ssologin/session",
        validate: "https://devapi.lrinternal.com/identity/v2/auth/access_token/validate",
        account: "https://devapi.lrinternal.com/identity/v2/auth/account",
        login: "https://account.devmayank.com/auth.aspx"
    }
}

const sessionCheckIframe = "https://account.devmayank.com/ssologin/session?signin=https%3A%2F%2Faccount.devmayank.com%2Fauth.aspx%3Freturn_url%3Dhttps%253A%252F%252Ffederation.com%252Fpoc%252Fstorage%252Findex.html"
// "https://account.devmayank.com/ssologin/session?signin=https%3A%2F%2Faccount.devmayank.com%2Fauth.aspx%3Freturn_url%3Dhttps%253A%252F%252Fsinglesignon.com%252Fpoc%252Fstorage%252Findex.html"

document.addEventListener('alpine:init', () => {
    var iframe = document.getElementById("session")
    Alpine.data('fedcmdemo', () => ({
        open: false,
        isLogedIn: false,
        profile: null,
        accessToken: null,
        toggle() {
            this.open = !this.open
        },

        async init() {
            var _self = this
            let accessToken = getParameterByName("token");
            if (accessToken) {
                localStorage.setItem("LRTokenKey", accessToken);
                window.location.href = options.endpoints.page
                return
            } else {
                accessToken = localStorage.getItem("LRTokenKey");
            }
            console.log({ accessToken })
            await _self.accessTokenListener(accessToken, true)
            window.addEventListener('message', async (ev) => {
                console.log(ev.data);
                if (!ev.data) {
                    return
                } else if (ev.data.ssologin && ev.data.ssologin.token) {
                    await _self.accessTokenListener(ev.data.ssologin.token, false)
                } else if (ev.data.ssologout) {
                     _self.afterLogout();
                }else if (ev.data.prompt) {
                    if (ev.data.action==="logout") {
                        _self.afterLogout();
                    }
                }
            });
        },
        async accessTokenListener(accessToken, renderiframe) {
            var _self = this
            console.log("accessTokenListener")
            let profile = await _self.getValidateNProfile(accessToken)
            if (profile) {
                _self.isLogedIn = true;
                _self.profile = profile;
                return true
            } else if (renderiframe) {
                let loginurl = sessionCheckIframe + "&action=login";
                iframe.src = loginurl
            }

            return false

        },
        async validateToken(accessToken) {
            try {
                const response = await fetch(`${options.endpoints.validate}?apikey=${options.apikey}`, {
                    headers: {
                        "Authorization": "Bearer " + accessToken,
                    },
                });
                const result = await response.json();
                if (result.ErrorCode) {
                    throw new Error(result.Message);
                }
                return result
            } catch (e) {
                throw e;
            }
        },
        async getprofile(accessToken) {
            try {
                const response = await fetch(`${options.endpoints.account}?apikey=${options.apikey}`, {
                    headers: {
                        "Authorization": "Bearer " + accessToken,
                    },
                });
                const result = await response.json();
                if (result.ErrorCode) {
                    throw new Error(result.Message);
                }
                return result
            } catch (e) {
                throw e;
            }
        },
        async getValidateNProfile(accessToken) {
            var _self = this
            if (!accessToken) {
                return false;
            }
            try {
                await _self.validateToken(accessToken);
                let profile = await _self.getprofile(accessToken);
                localStorage.setItem("LRTokenKey", accessToken);
                return profile;
            } catch (e) {
                localStorage.removeItem("LRTokenKey");
                return false;
            }
        },
        logout() {
            localStorage.removeItem("LRTokenKey");
            let logouturl = sessionCheckIframe + "&action=logout";
            iframe.src = logouturl
            return false
        },
        afterLogout() {
            console.log("logout done");
            window.location.href = options.endpoints.page
        }
    }))
    window.Alpine = Alpine;
})

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}