const pageOrigin = window.location.origin
const pagepath = "/poc/rws"
var idprovider = "https://dev-sso.devhub.lrinternal.com"
var hostedDomain = "https://devmayank.com"
const customDoamin = "account.devmayank.com"
if (customDoamin) {
    idprovider = `https://${customDoamin}`;
}
if (!hostedDomain) {
    hostedDomain = idprovider
}

const options = {
    apikey: "1583819b-9792-43c4-b8bf-0b9fd2e239ae",
    endpoints: {
        page: pageOrigin + pagepath + "/index.html",
        signin: pageOrigin + pagepath + "/sign-in.html",
        session: hostedDomain + "/ssologin2/session",
        validate: "https://devapi.lrinternal.com/identity/v2/auth/access_token/validate",
        account: "https://devapi.lrinternal.com/identity/v2/auth/account",
        login: idprovider + "/auth.aspx",
        consent: hostedDomain + "/ssologin2/consent"
    }
}

//const returnUrl = encodeURIComponent(options.endpoints.page)
//const signUrl = encodeURIComponent(`${options.endpoints.login}?return_url=${returnUrl}`)

//const signUrl = encodeURIComponent(options.endpoints.signin)
//const sessionCheckIframe = `${options.endpoints.session}?signin=${signUrl}`

const signUrl = encodeURIComponent(options.endpoints.signin)
const consent = encodeURIComponent(`${options.endpoints.consent}?callback=${signUrl}`)
const sessionCheckIframe = `${options.endpoints.session}?signin=${consent}`

console.log(sessionCheckIframe);

document.addEventListener('alpine:init', () => {
    var iframe = document.getElementById("session")
    var signBtn = document.getElementById("sign-in")
    ssoLoginUtil.initilizeParent();
    Alpine.data('fedcmdemo', () => ({
        open: false,
        isLogedIn: false,
        profile: null,
        accessToken: null,
        toggle() {
            console.log("togglePre", this.open)
            this.open = !this.open
            console.log("togglepost", this.open)
            console.log("isLogedIn", this.isLogedIn)
            //this.isLogedIn = !this.isLogedIn
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
            let isvalid = await _self.accessTokenListener(accessToken, true)
            if (!isvalid) {
                await _self.requestAccessStoragePermission()
            }
            // window.addEventListener('ssologin', async (ev) => {
            //     console.log("message", JSON.stringify(ev.detail,null, 4));
            //     if (!ev.detail) {
            //         return
            //     } else if (ev.detail.login && ev.detail.login.token) {
            //         await _self.accessTokenListener(ev.detail.login.token, false)
            //     } else if (ev.detail.logout) {
            //          _self.afterLogout();
            //     }else if (ev.detail.prompt && ev.detail.prompt!=="granted") {
            //         if (ev.detail.action==="logout") {
            //             _self.afterLogout();
            //         }else if(ev.detail.action==="prompt"){

            //         }
            //     }
            // });
        },
        async requestAccessStoragePermission() {
            try {
                let resp = await navigator.permissions.query({ name: 'top-level-storage-access', requestedOrigin: idprovider });
                if (resp.state === "granted") {
                    await _self.requestAccessStorageFor();
                }else if (resp.state === "prompt") {
                    signBtn.addEventListener("click", _self.signBtnClickListener);
                }
            } catch (error) {
                console.error(error)
            }
            return false
        },
        async requestAccessStorageFor(onBtnClick = false) {
            try {
                if ('requestStorageAccessFor' in document) {
                    await document.requestStorageAccessFor(idprovider)
                }
                let loginSession = await _self.LoginSession()
                if (loginSession.token && loginSession.isauthenticated) {
                    if (await _self.accessTokenListener(loginSession.token)) {
                        return;
                    }
                }
            } catch (e) {
                console.error(e)
            }
            if (onBtnClick) {
                window.location.href = options.endpoints.signin;
            }
            return;
        },
        async LoginSession() {
            try {
                let resp = await fetch(idprovider + '/ssologin/login', {
                    method: 'GET',
                    credentials: 'include'
                });
                return resp.json();
            } catch (error) {
                return { token: null, isauthenticated: false };
            }
        },
        async LogoutSession() {
            try {
                let resp = await fetch(idprovider + '/ssologin/logout', {
                    method: 'GET',
                    credentials: 'include'
                });
                return resp.json();
            } catch (error) {
                return { ok:true };
            }
        },
        async signBtnClickListener(ev) {
            await _self.requestAccessStorageFor(true)
        },
        async accessTokenListener(accessToken) {
            var _self = this
            console.log("accessTokenListener")
            let profile = await _self.getValidateNProfile(accessToken)
            if (profile) {
                _self.isLogedIn = true;
                _self.profile = profile;
                return true
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
        async logout() {
            localStorage.removeItem("LRTokenKey");
            await _self.LogoutSession()
            window.location.href = options.endpoints.page
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