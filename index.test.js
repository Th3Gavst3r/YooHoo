const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');

process.env.PORT = 3000;

describe('index.js', () => {
  it('hosts a webserver at $PORT', () => {
    const expressStub = {
      get: sinon.stub(),
      listen: sinon.stub(),
    };
    const express = sinon.stub().returns(expressStub);

    proxyquire('./index.js', {
      express: express,
      './discord-handler': sinon.stub(),
      './google-utils': sinon.stub(),
    });

    sinon.assert.calledOnce(expressStub.listen);
    sinon.assert.calledWith(expressStub.listen, process.env.PORT);
  });

  it('redirects / to Google OAuth consent screen', () => {
    const testUrl = 'www.example.com/consent';

    const expressStub = {
      get: sinon.spy(),
      listen: sinon.stub(),
    };
    const expressMock = sinon.stub().returns(expressStub);

    const googleUtils = {
      getConnectionUrl: sinon.stub().returns(testUrl),
    };

    proxyquire('./index.js', {
      express: expressMock,
      './discord-handler': sinon.stub(),
      './google-utils': googleUtils,
    });

    sinon.assert.calledWith(expressStub.get, '/');
    const callback = expressStub.get.getCall(0).args[1];

    const res = {
      redirect: sinon.stub(),
    };
    callback(null, res);
    sinon.assert.calledWith(res.redirect, testUrl);
  });

  it('sets OAuth tokens on /callback', () => {
    testAuthCode = 'fj9238ruaw';

    const expressStub = {
      get: sinon.spy(),
      listen: sinon.stub(),
    };
    const expressMock = sinon.stub().returns(expressStub);

    const googleUtils = {
      setTokens: sinon.stub(),
    };

    proxyquire('./index.js', {
      express: expressMock,
      './discord-handler': sinon.stub(),
      './google-utils': googleUtils,
    });

    sinon.assert.calledWith(expressStub.get, '/callback');
    const callback = expressStub.get.getCall(1).args[1];

    const req = {
      query: {
        code: testAuthCode,
      },
    };
    const res = {
      send: sinon.stub(),
    };

    callback(req, res);
    sinon.assert.calledWith(googleUtils.setTokens, testAuthCode);
    sinon.assert.calledOnce(res.send);
  });
});
