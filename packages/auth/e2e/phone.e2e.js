// const TEST_EMAIL = 'test@test.com';
// const TEST_PASS = 'test1234';

const TEST_PHONE_A = '+447445255123';
const TEST_CODE_A = '123456';

describe('auth() => Phone', () => {
  before(async () => {
    // Make sure we have a user connected with a phone number
    // let userCredential = null;
    // try {
    //   userCredential = await firebase.auth().createUserWithEmailAndPassword(TEST_EMAIL, TEST_PASS);
    // } catch (e) {
    //   // they may already exist, that's fine
    // }
    // if (!userCredential) {
    //   userCredential = await firebase.auth().signInWithEmailAndPassword(TEST_EMAIL, TEST_PASS);
    // }
    // const phoneSignIn = await firebase.auth().signInWithPhoneNumber(TEST_PHONE_A);

    // // https://firebase.google.com/docs/reference/rest/auth#section-auth-emulator-smsverification
    // const smsCodeFromREST = 'not-implemented';
    // const credential = firebase.auth.PhoneAuthProvider.credential(
    //   phoneSignIn.verificationId,
    //   smsCodeFromREST,
    // );
    // disabled until code fetching from emulator REST API is finished
    //firebase.auth().currentUser.updatePhoneNumber(credential);

    firebase.auth().settings.appVerificationDisabledForTesting = true;
    await firebase.auth().settings.setAutoRetrievedSmsCodeForPhoneNumber(TEST_PHONE_A, TEST_CODE_A);
    await Utils.sleep(50);
  });

  beforeEach(async () => {
    if (firebase.auth().currentUser) {
      await firebase.auth().signOut();
      await Utils.sleep(50);
    }
  });

  // Needs different set up to run against emulator - you can get OOB codes via emulator REST API:
  // https://firebase.google.com/docs/reference/rest/auth#section-auth-emulator-smsverification
  xdescribe('signInWithPhoneNumber', () => {
    it('signs in with a valid code', async () => {
      const confirmResult = await firebase.auth().signInWithPhoneNumber(TEST_PHONE_A);
      confirmResult.verificationId.should.be.a.String();
      should.ok(confirmResult.verificationId.length, 'verificationId string should not be empty');
      confirmResult.confirm.should.be.a.Function();
      const userCredential = await confirmResult.confirm(TEST_CODE_A);
      userCredential.user.should.be.instanceOf(jet.require('packages/auth/lib/User'));

      // Broken check, phone number is undefined
      // userCredential.user.phoneNumber.should.equal(TEST_PHONE_A);
    });

    it('errors on invalid code', async () => {
      const confirmResult = await firebase.auth().signInWithPhoneNumber(TEST_PHONE_A);
      confirmResult.verificationId.should.be.a.String();
      should.ok(confirmResult.verificationId.length, 'verificationId string should not be empty');
      confirmResult.confirm.should.be.a.Function();
      await confirmResult.confirm('666999').should.be.rejected();
      // TODO test error code and message
    });
  });

  // Needs different set up to run against emulator - these all require code fetching
  xdescribe('verifyPhoneNumber', async () => {
    it('successfully verifies', async () => {
      const confirmResult = await firebase.auth().signInWithPhoneNumber(TEST_PHONE_A);

      await confirmResult.confirm(TEST_CODE_A);
      await firebase.auth().verifyPhoneNumber(TEST_PHONE_A, false, false);
    });

    it('uses the autoVerifyTimeout when a non boolean autoVerifyTimeoutOrForceResend is provided', async () => {
      const confirmResult = await firebase.auth().signInWithPhoneNumber(TEST_PHONE_A);

      await confirmResult.confirm(TEST_CODE_A);
      await firebase.auth().verifyPhoneNumber(TEST_PHONE_A, 0, false);
    });

    it('throws an error with an invalid on event', async () => {
      const confirmResult = await firebase.auth().signInWithPhoneNumber(TEST_PHONE_A);

      await confirmResult.confirm(TEST_CODE_A);

      try {
        await firebase
          .auth()
          .verifyPhoneNumber(TEST_PHONE_A)
          .on('example', () => {});

        return Promise.reject(new Error('Did not throw Error.'));
      } catch (e) {
        e.message.should.containEql(
          "firebase.auth.PhoneAuthListener.on(*, _, _, _) 'event' must equal 'state_changed'.",
        );
        return Promise.resolve();
      }
    });

    it('throws an error with an invalid observer event', async () => {
      const confirmResult = await firebase.auth().signInWithPhoneNumber(TEST_PHONE_A);

      await confirmResult.confirm(TEST_CODE_A);

      try {
        await firebase
          .auth()
          .verifyPhoneNumber(TEST_PHONE_A)
          .on('state_changed', null, null, () => {});

        return Promise.reject(new Error('Did not throw Error.'));
      } catch (e) {
        e.message.should.containEql(
          "firebase.auth.PhoneAuthListener.on(_, *, _, _) 'observer' must be a function.",
        );
        return Promise.resolve();
      }
    });

    it('successfully runs verification complete handler', async () => {
      const confirmResult = await firebase.auth().signInWithPhoneNumber(TEST_PHONE_A);

      await confirmResult.confirm(TEST_CODE_A);

      await firebase
        .auth()
        .verifyPhoneNumber(TEST_PHONE_A)
        .then($ => $);

      return Promise.resolve();
    });

    it('successfully runs and adds emitters', async () => {
      const confirmResult = await firebase.auth().signInWithPhoneNumber(TEST_PHONE_A);

      await confirmResult.confirm(TEST_CODE_A);

      const obervserCb = () => {};

      const errorCb = () => {};

      const successCb = () => {
        return Promise.resolve();
      };

      await firebase
        .auth()
        .verifyPhoneNumber(TEST_PHONE_A)
        .on('state_changed', obervserCb, errorCb, successCb, () => {});
    });

    it('catches an error and emits an error event', async () => {
      const confirmResult = await firebase.auth().signInWithPhoneNumber(TEST_PHONE_A);

      await confirmResult.confirm(TEST_CODE_A);

      return firebase
        .auth()
        .verifyPhoneNumber('test')
        .catch(() => Promise.resolve());
    });
  });
});
