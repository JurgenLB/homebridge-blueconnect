export class BlueToken {
  identityId;
  token;
  credentials;
  constructor(
    identity_id : string,
    token : string,
    credentials : BlueCredentials,
  ) {
    this.identityId = identity_id;
    this.token = token;
    this.credentials = credentials;
  }
}

export class BlueCredentials {
  access_key : string;
  secret_key : string;
  session_token : string;
  expiration : string;

  constructor(
    access_key : string,
    secret_key: string,
    session_token: string,
    expiration: string,
  ) {
    this.access_key = access_key;
    this.secret_key = secret_key;
    this.session_token = session_token;
    this.expiration = expiration;
  }
}


