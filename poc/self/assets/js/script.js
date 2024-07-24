const pageOrigin = window.location.origin
const pagepath = window.location.pathname.replace(/\/$/, "");
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
        page : pageOrigin+ pagepath+ "/index.html",
        signin : pageOrigin+pagepath+ "/sign-in.html",
        session: hostedDomain+"/ssologin2/session",
        validate: "https://devapi.lrinternal.com/identity/v2/auth/access_token/validate",
        account: "https://devapi.lrinternal.com/identity/v2/auth/account",
        login: idprovider+"/auth.aspx",
        consent: hostedDomain+"/ssologin2/consent"
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
    //ssoLoginUtil.initilizeParent();
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
            await _self.accessTokenListener(accessToken, true)
            window.addEventListener('ssologin', async (ev) => {
                console.log(ev.data);
                if (!ev.data) {
                    return
                } else if (ev.data.login && ev.data.login.token) {
                    await _self.accessTokenListener(ev.data.login.token, false)
                } else if (ev.data.logout) {
                     _self.afterLogout();
                }else if (ev.data.prompt && ev.data.prompt!=="granted") {
                    if (ev.data.action==="logout") {
                        _self.afterLogout();
                    }else if(ev.data.action==="prompt"){
                        
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