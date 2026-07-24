/* MeraSIF — shared lead-capture modal.
 * Include after main.js. Two entry patterns:
 *   1. Gated downloads: <a href="file.pdf" data-gate="report-pdf" data-gate-title="...">
 *      → click opens the modal; on success the download starts.
 *   2. Programmatic: MSLead.open({source, title, desc, context, cta, onDone})
 * Posts through window.msifLead (sif-lead.php): name + WhatsApp number required,
 * email optional, honeypot included, source/context tagged per magnet.
 */
(function () {
  if (window.MSLead) return;

  var css = '.mslead-ov{position:fixed;inset:0;background:rgba(10,22,40,.55);backdrop-filter:blur(3px);z-index:2000;display:flex;align-items:center;justify-content:center;padding:18px;opacity:0;transition:opacity .2s}'
    + '.mslead-ov.show{opacity:1}'
    + '.mslead{background:#fff;border-radius:18px;max-width:430px;width:100%;padding:28px 26px;box-shadow:0 24px 70px rgba(10,22,40,.35);transform:translateY(14px);transition:transform .2s;max-height:92vh;overflow-y:auto}'
    + '.mslead-ov.show .mslead{transform:none}'
    + '.mslead h3{font-size:19px;font-weight:800;color:#0A1628;letter-spacing:-.4px;margin:0 0 6px}'
    + '.mslead p.d{font-size:13.5px;color:#475569;line-height:1.55;margin:0 0 16px}'
    + '.mslead label{display:block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:#64748B;margin:0 0 5px}'
    + '.mslead input{width:100%;padding:11px 13px;border:1.5px solid #CBD5E1;border-radius:10px;font-family:inherit;font-size:14px;color:#0A1628;margin-bottom:12px;outline:none;box-sizing:border-box}'
    + '.mslead input:focus{border-color:#1E40AF}'
    + '.mslead .go{width:100%;padding:13px;border:none;border-radius:11px;background:linear-gradient(135deg,#22D3EE,#3B82F6);color:#fff;font-family:inherit;font-size:14.5px;font-weight:800;cursor:pointer}'
    + '.mslead .go[disabled]{opacity:.55;cursor:default}'
    + '.mslead .x{float:right;background:#F1F5F9;border:none;width:30px;height:30px;border-radius:9px;font-size:14px;cursor:pointer;color:#475569}'
    + '.mslead .consent{font-size:11px;color:#94A3B8;line-height:1.5;margin:10px 0 0}'
    + '.mslead .ok{display:none;text-align:center;padding:10px 0 4px}'
    + '.mslead .ok .tick{font-size:34px}'
    + '.mslead .ok .t{font-size:15px;font-weight:800;color:#0A1628;margin:6px 0 4px}'
    + '.mslead .ok .s{font-size:13px;color:#475569;line-height:1.5}'
    + '.mslead .err{display:none;font-size:12.5px;color:#DC2626;margin:0 0 10px}'
    + '.mslead .hp{position:absolute;left:-9999px;opacity:0;height:0;width:0}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ov = null, state = {};

  function build() {
    ov = document.createElement('div');
    ov.className = 'mslead-ov';
    ov.innerHTML = '<div class="mslead" role="dialog" aria-modal="true">'
      + '<button class="x" aria-label="Close">✕</button>'
      + '<div class="frm"><h3></h3><p class="d"></p>'
      + '<div class="err"></div>'
      + '<label>Your name</label><input type="text" class="f-name" autocomplete="name" maxlength="80">'
      + '<label>WhatsApp number</label><input type="tel" class="f-phone" autocomplete="tel" inputmode="tel" maxlength="16" placeholder="+91…">'
      + '<label>Email (optional)</label><input type="email" class="f-email" autocomplete="email" maxlength="120">'
      + '<input type="text" class="hp" name="website" tabindex="-1" autocomplete="off">'
      + '<button class="go"></button>'
      + '<p class="consent">By submitting you agree that Trustner Asset Services (AMFI-registered distributor, ARN-286886) may contact you about SIF education and services. We never sell your data. Educational content only — not investment advice.</p></div>'
      + '<div class="ok"><div class="tick">✅</div><div class="t"></div><div class="s"></div></div>'
      + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.x').addEventListener('click', close);
    ov.querySelector('.go').addEventListener('click', submit);
    ov.querySelector('.f-phone').addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  }

  function close() { if (ov) { ov.classList.remove('show'); setTimeout(function () { ov.style.display = 'none'; }, 200); } }

  function open(opts) {
    state = opts || {};
    state._done = false;
    if (!ov) build();
    ov.querySelector('.frm').style.display = '';
    ov.querySelector('.ok').style.display = 'none';
    ov.querySelector('h3').textContent = state.title || 'Almost there';
    ov.querySelector('p.d').textContent = state.desc || 'Tell us where to reach you and we’ll keep you posted.';
    ov.querySelector('.go').textContent = state.cta || 'Get it →';
    ov.querySelector('.err').style.display = 'none';
    ov.style.display = 'flex';
    requestAnimationFrame(function () { ov.classList.add('show'); });
    setTimeout(function () { ov.querySelector('.f-name').focus(); }, 220);
  }

  function submit() {
    var nm = ov.querySelector('.f-name').value.trim();
    var ph = ov.querySelector('.f-phone').value.trim();
    var em = ov.querySelector('.f-email').value.trim();
    var err = ov.querySelector('.err');
    if (!nm || ph.replace(/\D/g, '').length < 8) {
      err.textContent = 'Please enter your name and a valid WhatsApp number.';
      err.style.display = 'block';
      return;
    }
    var go = ov.querySelector('.go'); go.disabled = true; go.textContent = 'Sending…';
    var payload = {
      name: nm, phone: ph, email: em,
      source: state.source || 'lead-magnet',
      message: state.context || '',
      fund: state.fund || '',
      website: ov.querySelector('.hp').value
    };
    var finish = function () {
      if (state._done) return; state._done = true;
      ov.querySelector('.frm').style.display = 'none';
      var ok = ov.querySelector('.ok');
      ok.style.display = 'block';
      ok.querySelector('.t').textContent = state.okTitle || 'Done!';
      ok.querySelector('.s').textContent = state.okDesc || 'Thank you — our team has your details.';
      go.disabled = false; go.textContent = state.cta || 'Get it →';
      if (state.onDone) try { state.onDone(); } catch (e) {}
      setTimeout(close, state.closeAfter || 2600);
    };
    if (window.msifLead) { window.msifLead(payload, finish); setTimeout(finish, 4000); }
    else finish();
    // note: finish() is idempotent-ish for UX; duplicate call only re-shows the ok panel
  }

  // gated download links
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-gate]') : null;
    if (!a) return;
    e.preventDefault();
    var href = a.getAttribute('href');
    open({
      source: 'gate:' + a.dataset.gate,
      title: a.dataset.gateTitle || 'Download the PDF',
      desc: a.dataset.gateDesc || 'Tell us where to send future editions and your download starts immediately.',
      cta: 'Download now →',
      context: 'Gated download: ' + href,
      okTitle: 'Downloading…',
      okDesc: 'Your PDF is on its way. We’ll also keep you posted on new editions.',
      onDone: function () {
        var t = document.createElement('a');
        t.href = href; t.download = '';
        document.body.appendChild(t); t.click(); t.remove();
      }
    });
  });

  window.MSLead = { open: open, close: close };
})();
