export const getFedCMCredential = async config => {
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

export const verifyToken = async (token) => {
    try {
        const response = await fetch("https://devapi.lrinternal.com/identity/v2/auth/access_token/validate?apikey=1583819b-9792-43c4-b8bf-0b9fd2e239ae", {
            headers: {
                "Authorization": "Bearer " + token,
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
}

export const getProfile = async (token) => {
    try {
        const response = await fetch("https://devapi.lrinternal.com/identity/v2/auth/account?apikey=1583819b-9792-43c4-b8bf-0b9fd2e239ae", {
            headers: {
                "Authorization": "Bearer " + token,
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
}