const pageOrigin = window.location.origin
const pagepath = "/poc/rws2"
var idprovider = "https://dev-sso.devhub.lrinternal.com"
var commonOptions = {};

commonOptions.apiKey = "1583819b-9792-43c4-b8bf-0b9fd2e239ae";
commonOptions.appName = "dev-sso";
commonOptions.hashTemplate = true;
commonOptions.debugMode = true;
commonOptions.accessTokenResponse = true;
commonOptions.formRenderDelay = '12'
commonOptions.callbackType = "hash"
commonOptions.customDomain = "account.devmayank.com"
commonOptions.isSSOLoginRedirect = true
commonOptions.verificationUrl = encodeURIComponent(window.location);
if (commonOptions.customDomain) {
    idprovider = `https://${commonOptions.customDomain}`;
}

var ssologin_options= {};
ssologin_options.onSuccess = function(response) {
	
	return
};
ssologin_options.onError = function(errors) {
	console.log(errors);
};

const options = {
    apikey: "1583819b-9792-43c4-b8bf-0b9fd2e239ae",
    endpoints: {
        page: pageOrigin + pagepath + "/index.html",
        signin: pageOrigin + pagepath + "/sign-in.html",
        validate: "https://devapi.lrinternal.com/identity/v2/auth/access_token/validate",
        account: "https://devapi.lrinternal.com/identity/v2/auth/account",
    }
}

var _self;

document.addEventListener('alpine:init', () => {
    var iframe = document.getElementById("session")
    var signBtn = document.getElementById("sign-in")
    ssoLoginUtil.initilizeParent();
    Alpine.data('fedcmdemo', () => ({
        open: false,
        isLogedIn: false,
        profile: null,
        accessToken: null,
        LRObject :new LoginRadiusV2(commonOptions),
        ssologin: {
            login:{
                async onSuccess(response) {
                    console.log({response})
                    await _self.accessTokenListener(response)
                },
                onError(errors) {
                    console.error(errors);
                }
            },
            logout:{
                onSuccess() {
                    window.location.href = options.endpoints.page
                },
                onError() {
                    window.location.href = options.endpoints.page
                }
            }
            
        },
        toggle() {
            this.open = !this.open
        },

        async init() {
            _self = this
            signBtn.addEventListener("click", _self.signBtnClickListener);
             _self.LRObject.util.ready(function () {
                if (commonOptions.customDomain){
                    _self.LRObject.options.customDomain = commonOptions.customDomain
                }
             })
            let accessToken = getParameterByName("token");
            if (accessToken) {
                localStorage.setItem("LRTokenKey", accessToken);
                window.location.href = options.endpoints.page
                return
            } else {
                accessToken = localStorage.getItem("LRTokenKey");
            }
            let isvalid = await _self.accessTokenListener(accessToken)
            if (!isvalid) {
                await _self.requestAccessStoragePermission()
            }
        },
        async requestAccessStoragePermission() {
            try {
                let resp = await navigator.permissions.query({ name: 'top-level-storage-access', requestedOrigin: idprovider });
                if (resp.state === "granted") {
                    await _self.requestAccessStorageFor();
                }else if (resp.state === "prompt") {
                    await _self.requestAccessStorageFor();
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
            } catch (e) {
                console.error(e)
            }
            _self.LRObject.init("ssoLogin", _self.ssologin.login);
            if (onBtnClick) {
                window.location.href = options.endpoints.signin;
            }
            return;
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
            _self.LRObject.init("logout", _self.ssologin.logout);
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