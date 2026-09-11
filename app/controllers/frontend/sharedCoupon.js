const crypto = require('crypto');

const SUCCESS_MESSAGE = 'Coupon added successfully! You added a shared coupon.';

module.exports = function (model, config) {
  const module = {};

  const getShare = (shareToken) => model.CouponShares.findOne({
    where: { shareToken },
    raw: true,
  });

  const getCouponData = async (share) => {
    const coupon = await model.Coupon.findOne({
      where: { id: share.couponId, isExpired: false },
      raw: true,
    });

    if (!coupon) return null;

    const brand = await model.Brand.findOne({
      where: { id: coupon.brand_id },
      raw: true,
    });

    return {
      ...coupon,
      productId: share.productId,
      brandLogo: brand?.brandLogo || '',
      brandName: brand?.brandName || '',
    };
  };

  module.create = async function (req, res) {
    try {
      const { couponId, productId } = req.body;
      const sharerUserId = req.authUserId;

      if (!couponId || !sharerUserId) {
        return res.status(400).send({ status: 'fail', message: 'Please provide a valid coupon.' });
      }

      const coupon = await model.Coupon.findOne({
        where: { id: couponId, isExpired: false },
        raw: true,
      });
      if (!coupon) {
        return res.status(404).send({ status: 'fail', message: 'Coupon not found or expired.' });
      }

      const bagWhere = { coupon_id: couponId, isExpired: false };
      if (productId) bagWhere.productId = String(productId);
      const bag = await model.Bags.findOne({ where: bagWhere, raw: true });
      const resolvedProductId = String(productId || bag?.productId || '0');
      const shareToken = crypto.randomBytes(32).toString('base64url');
      const shareUrl = `${config.shareBaseUrl}/coupon/share/${shareToken}`;
      console.log('shareUrl', shareUrl, couponId, resolvedProductId, sharerUserId, shareToken, shareUrl);
      const share = await model.CouponShares.create({
        couponId,
        productId: resolvedProductId,
        sharerUserId,
        shareToken,
        shareUrl,
      });

      const ownerRecord = await model.CouponRecords.findOne({
        where: { userId: sharerUserId, couponId, productId: resolvedProductId },
      });
      console.log('ownerRecord', ownerRecord);
      if (!ownerRecord) {
        await model.CouponRecords.create({
          userId: sharerUserId,
          couponId,
          productId: resolvedProductId,
          status: 'assigned',
        });
      }

      return res.status(200).send({
        status: 'success',
        data: {
          shareId: share.id,
          couponId: coupon.id,
          shareToken,
          url: shareUrl,
        },
      });
    } catch (error) {
      console.error('create shared coupon error:', error);
      return res.status(500).send({ status: 'fail', message: 'Something went wrong, please try again.' });
    }
  };

  module.resolve = async function (req, res) {
    try {
      const share = await getShare(req.params.shareToken);
      if (!share) return res.status(404).send({ status: 'fail', message: 'Share link is invalid or expired.' });

      const coupon = await getCouponData(share);
      if (!coupon) return res.status(404).send({ status: 'fail', message: 'Coupon is no longer available.' });

      return res.status(200).send({
        status: 'success',
        data: {
          couponId: coupon.id,
          productId: share.productId,
          shareToken: share.shareToken,
          coupon,
        },
      });
    } catch (error) {
      console.error('resolve shared coupon error:', error);
      return res.status(500).send({ status: 'fail', message: 'Something went wrong, please try again.' });
    }
  };

  module.add = async function (req, res) {
    try {
      const recipientUserId = req.authUserId;
      const share = await getShare(req.params.shareToken);
      if (!share) return res.status(404).send({ status: 'fail', message: 'Share link is invalid or expired.' });
      if (!recipientUserId) return res.status(401).send({ status: 'fail', message: 'Please log in first.' });
      if (recipientUserId === share.sharerUserId) {
        return res.status(400).send({ status: 'fail', message: 'You cannot add your own shared coupon.' });
      }

      const coupon = await getCouponData(share);
      if (!coupon) return res.status(404).send({ status: 'fail', message: 'Coupon is no longer available.' });

      const existing = await model.CouponRecords.findOne({
        where: {
          userId: recipientUserId,
          couponId: share.couponId,
          productId: share.productId,
        },
      });

      if (!existing) {
        await model.CouponRecords.create({
          userId: recipientUserId,
          couponId: share.couponId,
          productId: share.productId,
          friendId: recipientUserId,
          status: 'assigned',
        });
      } else {
        await existing.update({
          friendId: recipientUserId,
        });
      }

      return res.status(200).send({
        status: 'success',
        message: SUCCESS_MESSAGE,
        data: { couponId: share.couponId, friendId: recipientUserId, productId: share.productId },
      });
    } catch (error) {
      console.error('add shared coupon error:', error);
      return res.status(500).send({ status: 'fail', message: 'Something went wrong, please try again.' });
    }
  };

  module.landing = async function (req, res) {
    const token = encodeURIComponent(req.params.shareToken || '');
    const appUrl = `bagvertising://coupon/share/${token}`;
    const playStoreUrl = `${config.androidStoreUrl}&referrer=share_token%3D${token}`;
    const appStoreUrl = `${config.iosStoreUrl}${config.iosStoreUrl.includes('?') ? '&' : '?'}share_token=${token}`;
    res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#30a1a4">
  <title>Shared coupon | Bagvertising</title>
  <style>
    :root { color-scheme: light; --teal: #343a40; --teal-dark: #247d80; --blue: #007bff; --ink: #1f2933; --muted: #66727d; --line: #e4ecec; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; color: var(--ink); background: #f4f8f8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .page { min-height: 100vh; display: flex; flex-direction: column; }
    .topbar { height: 72px; display: flex; align-items: center; justify-content: space-between; padding: 0 7vw; color: #fff; background: var(--teal); box-shadow: 0 3px 12px rgba(36, 125, 128, .18); }
    .brand { display: flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; font-size: 15px; font-weight: 700; letter-spacing: .08em; }
    .brand img { width: 42px; height: 42px; object-fit: contain; }
    .brand span { white-space: nowrap; }
    .topbar-label { font-size: 12px; opacity: .9; }
    main { width: min(100% - 32px, 560px); margin: auto; padding: 44px 0 52px; }
    .hero { text-align: center; }
    .eyebrow { margin: 0 0 12px; color: var(--teal-dark); font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(28px, 7vw, 42px); line-height: 1.1; letter-spacing: 0; }
    .intro { max-width: 390px; margin: 14px auto 28px; color: var(--muted); font-size: 16px; line-height: 1.6; }
    .share-card { overflow: hidden; border: 1px solid var(--line); border-radius: 8px; background: #fff; box-shadow: 0 14px 35px rgba(31, 41, 51, .08); }
    .card-accent { height: 6px; background: var(--blue); }
    .card-content { padding: 28px 24px 26px; text-align: center; }
    .coupon-icon { width: 58px; height: 58px; display: grid; place-items: center; margin: 0 auto 16px; border-radius: 50%; color: var(--teal-dark); background: #e5f5f5; font-size: 27px; }
    .card-content h2 { margin: 0 0 8px; font-size: 21px; }
    .card-content p { margin: 0 auto 22px; color: var(--muted); line-height: 1.55; }
    .open-button, .store-button { display: flex; align-items: center; justify-content: center; gap: 9px; min-height: 48px; border-radius: 4px; font-weight: 700; text-decoration: none; transition: background .2s ease, transform .2s ease; }
    .open-button { color: #fff; background: var(--blue); }
    .open-button:hover { color: #fff; background: var(--teal-dark); transform: translateY(-1px); }
    .store-links { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
    .store-button { border: 1px solid var(--line); color: var(--ink); background: #fff; font-size: 13px; }
    .store-button:hover { color: var(--teal-dark); border-color: var(--teal); }
    .store-button small { display: block; color: var(--muted); font-size: 10px; font-weight: 400; }
    .footer { margin-top: 28px; color: #89949b; font-size: 12px; text-align: center; }
    @media (max-width: 420px) { .topbar { padding: 0 20px; } .topbar-label { display: none; } main { width: min(100% - 24px, 560px); padding-top: 32px; } .card-content { padding-inline: 18px; } }
  </style>
</head>
<body>
  <div class="page">
    <header class="topbar">
      <a class="brand" href="${appUrl}"><img src="/dist/img/bagvetising_logo.png" alt="Bagvertising"><span>BAGVERTISING</span></a>
      <span class="topbar-label">Share smarter. Save more.</span>
    </header>
    <main>
      <section class="hero">
        <p class="eyebrow">A coupon was shared with you</p>
        <h1>Unlock your Bagvertising offer</h1>
        <p class="intro">Open the Bagvertising app to add this coupon to your account and start saving.</p>
      </section>
      <section class="share-card" aria-labelledby="share-title">
        <div class="card-accent"></div>
        <div class="card-content">
          <div class="coupon-icon" aria-hidden="true">%</div>
          <h2 id="share-title">Your shared coupon is ready</h2>
          <p>Continue in the app for the best experience.</p>
          <a class="open-button" href="${appUrl}"><span aria-hidden="true">&#8599;</span> Open in Bagvertising</a>
          <div class="store-links">
            <a class="store-button" href="${playStoreUrl}"><span aria-hidden="true">&#9654;</span><span><small>GET IT ON</small>Google Play</span></a>
            <a class="store-button" href="${appStoreUrl}"><span aria-hidden="true">&#63743;</span><span><small>DOWNLOAD ON THE</small>App Store</span></a>
          </div>
        </div>
      </section>
      <p class="footer">Powered by Bagvertising</p>
    </main>
  </div>
</body>
</html>`);
  };

  return module;
};
