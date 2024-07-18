const options = {
    apikey: "1583819b-9792-43c4-b8bf-0b9fd2e239ae",
    endpoints: {
        page: window.location.origin + "/poc/fedcm/index.html",
        session: "https://account.devmayank.com/ssologin/session",
        validate: "https://devapi.lrinternal.com/identity/v2/auth/access_token/validate",
        account: "https://devapi.lrinternal.com/identity/v2/auth/account",
        login: "https://account.devmayank.com//fedcm/login"
    },
    fedcm: {
        idpConfig: [
            {
                configURL: "https://account.devmayank.com/fedcm/config.json",
                clientId: "123",
            }
        ],
        nonce: "123456789",
        context: "signin",
        mediation: "optional",
        mode: "widget",
        triggerOn: "pageload"
    }
}

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
            window.addEventListener("message",  _self.messageEventListner);
            accessToken = localStorage.getItem("LRTokenKey");
            let isProfileSet = await _self.accessTokenListener(accessToken)
            if (!isProfileSet && "IdentityCredential" in window) {
                await _self.SignIn()
            }
        },
        async messageEventListner(ev) {
            console.log("ev",ev.data)
        },
        async accessTokenListener(accessToken) {
            var _self = this
            console.log("accessTokenListener", accessToken)
            let profile = await _self.getValidateNProfile(accessToken)
            if (profile) {
                _self.isLogedIn = true;
                _self.profile = profile;
                return true
            }
            return false

        },
        async SignIn() {
            var _self = this
            try {
                const credential = await getFedCMCredential(options.fedcm);
                const token = credential.token;
                await _self.accessTokenListener(token)
            } catch (e) {
                console.log(e);
            }

        },
        async SignPopup() {
            let _self = this
            let wnd = popupwindow(options.endpoints.login, 'lrpopupchildwindow', 0, 0);
            
            var timer = setInterval(function () {
                if (wnd.closed) {
                    clearInterval(timer);
                   // window.location.href = options.endpoints.page;
                }
            }, 1000);
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
            navigator.credentials.preventSilentAccess();
            window.location.href = options.endpoints.page;
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

const getFedCMCredential = async config => {
    const providers = config.idpConfig.map(idp => {
        return {
            configURL: idp.configURL,
            clientId: idp.clientId,
        }
    })
    const providersWithNonce = providers.map(provider => {
        let newProvider = {
            ...provider,
            nonce: config.nonce,
            allowNewSession: false,
        }
        if (config && config.scope) {
            newProvider.scope = config.scope
        }

        return newProvider
    })
    let identity = {
        providers: providersWithNonce
    }
    if (config && config.context) {
        identity.context = config.context
    }
    if (config && config.mode === 'button') {
        identity.mode = config.mode
    }
    let options = {
        identity: identity
    }
    if (config && config.mediation) {
        options.mediation = config.mediation
    }
    return navigator.credentials.get(options)
}

function popupwindow(url, title, w, h) {
    var left = (screen.width / 2) - (w / 2);
    var top = (screen.height / 2) - (h / 2);
    return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
} 