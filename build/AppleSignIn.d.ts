import { SigningKey } from "@nora-soderlund/jwks-rsa";
export interface AppleSignInOptions {
    /**
     * Apple Service ID.
     * @example "com.my-company.my-app"
     */
    clientId: string;
    /**
     * Apple Developer Team ID.
     * @example "5B645323E8"
     */
    teamId: string;
    /**
     * Identifier of the private key.
     * @example "U3B842SVGC"
     */
    keyIdentifier: string;
    /**
     * Absolute path to private key file.
     * File extension doesn't matter, we read the file contents
     * @example '/Users/arnold/my-project/credentials/AuthKey.p8'
     */
    privateKeyPath?: string;
    /**
     * Contents of private key.
     * Prefered method if injecting private key from environments.
     * @example "-----BEGIN PRIVATE KEY-----\nMIGTAgEHIHMJKJyqGSM32AgEGC..."
     */
    privateKey?: string;
}
/**
 * The response token object returned on a successful request.
 * @link https://developer.apple.com/documentation/sign_in_with_apple/tokenresponse
 */
export interface AccessTokenResponse {
    /**
     * (Reserved for future use) A token used to access allowed data. Currently, no data set has been defined for access.
     */
    access_token: string;
    /**
     * The amount of time, in seconds, before the access token expires.
     */
    expires_in: number;
    /**
     * A JSON Web Token that contains the user’s identity information.
     */
    id_token: string;
    /**
     * The refresh token used to regenerate new access tokens. Store this token securely on your server.
     */
    refresh_token: string;
    /**
     * The type of access token. It will always be bearer.
     */
    token_type: string;
}
export type RefreshTokenResponse = Pick<AccessTokenResponse, "access_token" | "expires_in" | "token_type">;
/**
 * https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/authenticating_users_with_sign_in_with_apple#3383773
 */
export interface AppleIdTokenType {
    /**
     * The issuer-registered claim key, which has the value https://appleid.apple.com.
     * @example "https://appleid.apple.com"
     */
    iss: string;
    /**
     * The unique identifier for the user.
     * @example "001999.80b18c74c3264cad895d0eae181d8f50.1909"
     */
    sub: string;
    /**
     * Your client_id in your Apple Developer account.
     * @example "com.unity.testApp"
     */
    aud: string;
    /**
     * The expiry time for the token. This value is typically set to five minutes.
     * @example 1568671600
     */
    exp: string;
    /**
     * The time the token was issued.
     * @example 1568671000
     */
    iat: string;
    /**
     * The hash of the authorization code. It’s only used when you need to validate the authorization code.
     * @example "agyAh42GdE-O72Y4HUHypg"
     */
    c_hash: string;
    /**
     * A String value used to associate a client session and an ID token. This value is used to mitigate replay attacks and is present only if passed during the authorization request.
     */
    nonce: string;
    /**
     * A Boolean value that indicates whether the transaction is on a nonce-supported platform. If you sent a nonce in the authorization request but do not see the nonce claim in the ID token, check this claim to determine how to proceed. If this claim returns true you should treat nonce as mandatory and fail the transaction; otherwise, you can proceed treating the nonce as optional.
     */
    nonce_supported: boolean;
    /**
     * [First login only] The user's email address.
     * @example xxx@privaterelay.appleid.com
     */
    email?: string;
    /**
     * [First login only] A Boolean value that indicates whether the service has verified the email. The value of this
     * claim is always true because the servers only return verified email addresses.
     * @example true
     */
    email_verified?: boolean;
    /**
     * Determine whether email is Apple private (trough relay) one or not.
     * In my testing, is_private_email property will only be present if it is true.
     * @example true
     */
    is_private_email?: boolean;
    auth_time: number;
}
export declare class AppleSignIn {
    private clientId;
    private teamId;
    private keyIdentifier;
    private privateKey;
    private jwksClient;
    constructor(options: AppleSignInOptions);
    /**
     * Function that generates a url that can be used to redirect the user and begin the "Sign in with Apple" flow.
     * @link https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/incorporating_sign_in_with_apple_into_other_platforms#3332113
     */
    getAuthorizationUrl(options: {
        /**
         * The destination URI the code was originally sent to.
         */
        redirectUri: string;
        /**
         * The amount of user information requested from Apple.
         *
         * You can request the user’s "name" or "email". You can also choose to request both, or neither.
         * Ommiting the property or providing any empty won't request any scopes.
         *
         * @example ['email']
         * @example ['name', 'email']
         */
        scope?: ("name" | "email")[];
        /**
         * A unique and non-guessable value that helps prevent CSRF attacks. Usually a UUID string.
         * @link https://auth0.com/docs/protocols/oauth2/oauth-state
         */
        state?: string;
        /**
         * A String value used to associate a client session with an ID token. This value is also used to mitigate replay attacks.
         */
        nonce?: string;
    }): string;
    getAuthorizationToken(
    /**
     * A secret generated as a JSON Web Token that uses the secret key generated by the WWDR portal.
     */
    clientSecret: string, 
    /**
     * A single-use authorization code that is valid for five minutes from generation.
     */
    code: string, options: {
        /**
         * The destination URI the code was originally sent to.
         */
        redirectUri?: string;
    }): Promise<AccessTokenResponse>;
    refreshAuthorizationToken(
    /**
     * A secret generated as a JSON Web Token that uses the secret key generated by the WWDR portal.
     */
    clientSecret: string, 
    /**
     * The refresh token received during the authorization request.
     */
    refreshToken: string): Promise<RefreshTokenResponse>;
    createClientSecret(options: {
        /**
         * The expiration duration for registered claim key in seconds.
         * The value of which must not be greater than 15777000 (6 months in seconds) from the Current Unix Time on the
         * server.
         * @link https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens#3262048
         * @default 15777000
         */
        expirationDuration?: number;
    }): Promise<string>;
    getAppleSigningKey(kid: string): Promise<SigningKey>;
    /**
     * Verify identity of a give JsonWebToken string.
     */
    verifyIdToken(idToken: string, options: {
        /**
         * The nonce parameter value needs to include per-session state and be unguessable to attackers.
         */
        nonce?: string;
        /**
         * If you want to handle expiration on your own or decode expired tokens you can set to ignore expiration
         * @default false
         */
        ignoreExpiration?: boolean;
        /**
         * If you want to check subject (sub) a.k.a "user_identifier"
         */
        subject?: string;
    }): Promise<AppleIdTokenType>;
}
export default AppleSignIn;
//# sourceMappingURL=AppleSignIn.d.ts.map