/* ============================================
   AgenticCore Pakistan — data layer (Supabase)
   Auth functions mirror agenticcore.estate's db-client.js exactly
   (same project, same handle_new_user trigger, same phone-or-email
   login via email_for_phone), so an account made on either site
   works on both. Everything pk-specific goes through pk_* RPCs.
   ============================================ */

const PkDB = (function () {
  function err(e) { return e ? (e.message || String(e)) : null; }

  async function currentUser() {
    if (!supabaseClient) return null; // Supabase script blocked or offline: behave as logged out
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return null;
    const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
    if (error || !data) return null;
    data.email = session.user.email;
    return data;
  }

  async function signUp(payload) {
    const { data: existingEmail } = await supabaseClient.rpc('email_for_phone', { phone_input: payload.phone });
    if (existingEmail) return { error: 'An account with this phone number already exists. Log in with it instead — it works on agenticcore.estate too.' };

    const { data, error } = await supabaseClient.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo: window.location.origin + '/login.html',
        data: { full_name: payload.fullName, phone: payload.phone, role: payload.role || 'buyer', referral_code: payload.referralCode || '' }
      }
    });
    if (error) {
      if (/registered|exists/i.test(error.message)) return { error: 'An account with this email already exists. Log in with it instead.' };
      return { error: error.message };
    }
    if (!data.session) return { needsConfirmation: true };
    return { user: await currentUser() };
  }

  async function logIn(identifier, password) {
    let email = identifier;
    if (identifier.indexOf('@') === -1) {
      const { data: resolvedEmail } = await supabaseClient.rpc('email_for_phone', { phone_input: identifier });
      if (!resolvedEmail) return { error: 'Incorrect phone/email or password.' };
      email = resolvedEmail;
    }
    const { error } = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
    if (error) return { error: 'Incorrect phone/email or password.' };
    const user = await currentUser();
    if (!user) return { error: 'Could not load your account — please try again.' };
    return { user: user };
  }

  async function logOut() { await supabaseClient.auth.signOut(); }

  // ---------- shared referral / points (same RPC as estate) ----------
  async function getDirectReferrals() {
    const { data } = await supabaseClient.rpc('get_my_direct_referrals');
    return (data || []).map(function (r) { return { id: r.id, fullName: r.full_name, joinedAt: r.joined_at }; });
  }
  async function getPointsLedger(userId) {
    const { data } = await supabaseClient.from('referral_ledger').select('*').eq('beneficiary_id', userId).order('created_at', { ascending: false }).limit(50);
    return data || [];
  }

  // ---------- estate listings (read only, same login) ----------
  async function getMyEstateListings(userId) {
    const { data } = await supabaseClient.from('listings').select('id,title,city,area,price,type,created_at').eq('owner_id', userId).order('created_at', { ascending: false }).limit(5);
    const { count } = await supabaseClient.from('listings').select('id', { count: 'exact', head: true }).eq('owner_id', userId);
    return { listings: data || [], count: count || 0 };
  }

  // ---------- orders ----------
  async function placeOrder(items) {
    const { data, error } = await supabaseClient.rpc('pk_place_order', { p_items: items, p_source: 'web' });
    return { rows: data || [], error: err(error) };
  }
  async function buyPackage(packageId) {
    const { data, error } = await supabaseClient.rpc('pk_buy_package', { p_package: packageId, p_accept_terms: true });
    return { row: (data || [])[0], error: err(error) };
  }

  // ---------- tasks ----------
  async function listTasks() {
    const { data, error } = await supabaseClient.from('pk_tasks').select('*').order('created_at', { ascending: false });
    return { tasks: data || [], error: err(error) };
  }
  async function getTaskByPublicId(publicId) {
    const { data } = await supabaseClient.from('pk_tasks').select('*').eq('public_id', publicId).maybeSingle();
    return data;
  }
  async function taskEvents(taskId) {
    const { data } = await supabaseClient.from('pk_task_events').select('*').eq('task_id', taskId).order('id');
    return data || [];
  }
  async function taskMessages(taskId) {
    const { data } = await supabaseClient.from('pk_messages').select('*').eq('task_id', taskId).order('id');
    return data || [];
  }
  async function taskAttachments(taskId) {
    const { data } = await supabaseClient.from('pk_attachments').select('*').eq('task_id', taskId).order('created_at');
    return data || [];
  }
  async function taskRevisions(taskId) {
    const { data } = await supabaseClient.from('pk_revisions').select('*').eq('task_id', taskId).order('round');
    return data || [];
  }
  async function postMessage(taskId, body) {
    const { error } = await supabaseClient.rpc('pk_post_message', { p_task: taskId, p_body: body });
    return { error: err(error) };
  }
  async function addDetails(taskId, details, note) {
    const { error } = await supabaseClient.rpc('pk_add_details', { p_task: taskId, p_details: details || {}, p_note: note || '' });
    return { error: err(error) };
  }
  async function cancelTask(taskId) {
    const { error } = await supabaseClient.rpc('pk_cancel_task', { p_task: taskId });
    return { error: err(error) };
  }
  async function requestChanges(taskId, note, attachmentPath) {
    const { data, error } = await supabaseClient.rpc('pk_request_changes', { p_task: taskId, p_note: note, p_attachment: attachmentPath || null });
    return { round: data, error: err(error) };
  }
  async function approveDelivery(taskId) {
    const { error } = await supabaseClient.rpc('pk_approve_delivery', { p_task: taskId });
    return { error: err(error) };
  }

  function safeName(name) { return String(name || 'file').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-80); }

  async function uploadAttachment(userId, task, file) {
    const path = userId + '/' + task.public_id + '/' + Date.now() + '-' + safeName(file.name);
    const up = await supabaseClient.storage.from('pk-attachments').upload(path, file);
    if (up.error) return { error: up.error.message };
    const { error } = await supabaseClient.rpc('pk_register_attachment', { p_task: task.id, p_path: path, p_name: file.name });
    return { path: path, error: err(error) };
  }

  // ---------- deliveries ----------
  async function listDeliverables() {
    const { data } = await supabaseClient.from('pk_deliverables').select('*, pk_tasks(public_id, title, status, revisions_used)').order('created_at', { ascending: false });
    return data || [];
  }
  async function signedUrl(bucket, path, download) {
    const { data } = await supabaseClient.storage.from(bucket).createSignedUrl(path, 3600, download ? { download: true } : undefined);
    return data ? data.signedUrl : null;
  }

  // ---------- money ----------
  async function listInvoices() {
    const { data } = await supabaseClient.from('pk_invoices').select('*').order('created_at', { ascending: false });
    return data || [];
  }

  // ---------- packages & usage ----------
  async function listSubscriptions() {
    const { data } = await supabaseClient.from('pk_subscriptions').select('*').order('created_at', { ascending: false });
    return data || [];
  }
  async function listUsage(subscriptionId) {
    const { data } = await supabaseClient.from('pk_usage').select('*, pk_tasks(public_id)').eq('subscription_id', subscriptionId).order('created_at', { ascending: false });
    return data || [];
  }
  async function listAllowances(packageId) {
    const { data } = await supabaseClient.from('pk_package_allowances').select('*').eq('package_id', packageId);
    return data || [];
  }

  // ---------- profile, settings, brand kit ----------
  async function getSettings(userId) {
    const { data } = await supabaseClient.from('pk_client_settings').select('*').eq('client_id', userId).maybeSingle();
    return data;
  }
  async function saveSettings(userId, patch) {
    const row = Object.assign({ client_id: userId, updated_at: new Date().toISOString() }, patch);
    const { error } = await supabaseClient.from('pk_client_settings').upsert(row);
    return { error: err(error) };
  }
  async function updateProfileName(userId, fullName) {
    const { error } = await supabaseClient.from('profiles').update({ full_name: fullName }).eq('id', userId);
    return { error: err(error) };
  }
  async function getBrandKit(userId) {
    const { data } = await supabaseClient.from('pk_brand_kits').select('*').eq('client_id', userId).maybeSingle();
    return data;
  }
  async function saveBrandKit(userId, patch) {
    const row = Object.assign({ client_id: userId, updated_at: new Date().toISOString() }, patch);
    const { error } = await supabaseClient.from('pk_brand_kits').upsert(row);
    return { error: err(error) };
  }
  async function uploadBrandFile(userId, file) {
    const path = userId + '/' + Date.now() + '-' + safeName(file.name);
    const up = await supabaseClient.storage.from('pk-brand-kits').upload(path, file);
    return up.error ? { error: up.error.message } : { path: path };
  }
  async function listNotifications() {
    const { data } = await supabaseClient.from('pk_notifications').select('*').eq('channel', 'dashboard').order('created_at', { ascending: false }).limit(30);
    return data || [];
  }

  // ---------- public forms ----------
  async function submitLead(lead) {
    const { error } = await supabaseClient.from('pk_leads').insert(lead);
    return { error: err(error) };
  }

  // ---------- admin ----------
  const admin = {
    async tasks() {
      const { data } = await supabaseClient.from('pk_tasks').select('*').order('created_at', { ascending: false }).limit(500);
      return data || [];
    },
    async clients() {
      const { data } = await supabaseClient.rpc('pk_admin_clients');
      return data || [];
    },
    async setStatus(taskId, status, note, missing, lateReason, newDue) {
      const { error } = await supabaseClient.rpc('pk_admin_set_status', {
        p_task: taskId, p_status: status, p_note: note || null, p_missing: missing && missing.length ? missing : null,
        p_late_reason: lateReason || null, p_new_due: newDue || null
      });
      return { error: err(error) };
    },
    async createTask(clientId, lineId, qty, details, source) {
      const { data, error } = await supabaseClient.rpc('pk_admin_create_task', { p_client: clientId, p_line: lineId, p_qty: qty, p_details: details || {}, p_source: source, p_title: null });
      return { task: data, error: err(error) };
    },
    async deliver(task, file, url, label, kind) {
      let path = null;
      if (file) {
        path = task.client_id + '/' + task.public_id + '/' + Date.now() + '-' + safeName(file.name);
        const up = await supabaseClient.storage.from('pk-deliverables').upload(path, file);
        if (up.error) return { error: up.error.message };
      }
      const { error } = await supabaseClient.rpc('pk_admin_add_deliverable', { p_task: task.id, p_kind: kind, p_path: path, p_url: url || null, p_label: label || null, p_mark_ready: true });
      return { error: err(error) };
    },
    async invoices() {
      const { data } = await supabaseClient.from('pk_invoices').select('*').order('created_at', { ascending: false }).limit(300);
      return data || [];
    },
    async setInvoiceStatus(id, status, paidAmount) {
      const { error } = await supabaseClient.rpc('pk_admin_set_invoice_status', { p_invoice: id, p_status: status, p_paid_amount: paidAmount == null ? null : paidAmount });
      return { error: err(error) };
    },
    async createInvoice(clientId, description, amount) {
      const { error } = await supabaseClient.rpc('pk_admin_create_invoice', { p_client: clientId, p_description: description, p_amount: amount, p_due: null, p_task: null, p_subscription: null });
      return { error: err(error) };
    },
    async subscriptions() {
      const { data } = await supabaseClient.from('pk_subscriptions').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    async setSubscriptionStatus(id, status) {
      const { error } = await supabaseClient.rpc('pk_admin_set_subscription_status', { p_sub: id, p_status: status });
      return { error: err(error) };
    },
    async recordUsage(subId, item, qty, taskId, note) {
      const { error } = await supabaseClient.rpc('pk_admin_record_usage', { p_sub: subId, p_item: item, p_qty: qty, p_task: taskId || null, p_note: note || null });
      return { error: err(error) };
    },
    async leads() {
      const { data } = await supabaseClient.from('pk_leads').select('*').order('created_at', { ascending: false }).limit(300);
      return data || [];
    },
    async setLeadStatus(id, status) {
      const { error } = await supabaseClient.from('pk_leads').update({ status: status }).eq('id', id);
      return { error: err(error) };
    },
    async events(sinceIso) {
      const { data } = await supabaseClient.from('pk_events').select('event,section,path,created_at').gte('created_at', sinceIso).limit(5000);
      return data || [];
    },
    async settings() {
      const { data } = await supabaseClient.from('pk_settings').select('*');
      return data || [];
    },
    async saveSetting(key, value) {
      const { error } = await supabaseClient.from('pk_settings').upsert({ key: key, value: value, updated_at: new Date().toISOString() });
      return { error: err(error) };
    }
  };

  return {
    currentUser: currentUser, signUp: signUp, logIn: logIn, logOut: logOut,
    getDirectReferrals: getDirectReferrals, getPointsLedger: getPointsLedger, getMyEstateListings: getMyEstateListings,
    placeOrder: placeOrder, buyPackage: buyPackage,
    listTasks: listTasks, getTaskByPublicId: getTaskByPublicId, taskEvents: taskEvents, taskMessages: taskMessages,
    taskAttachments: taskAttachments, taskRevisions: taskRevisions, postMessage: postMessage, addDetails: addDetails,
    cancelTask: cancelTask, requestChanges: requestChanges, approveDelivery: approveDelivery, uploadAttachment: uploadAttachment,
    listDeliverables: listDeliverables, signedUrl: signedUrl, listInvoices: listInvoices,
    listSubscriptions: listSubscriptions, listUsage: listUsage, listAllowances: listAllowances,
    getSettings: getSettings, saveSettings: saveSettings, updateProfileName: updateProfileName,
    getBrandKit: getBrandKit, saveBrandKit: saveBrandKit, uploadBrandFile: uploadBrandFile, listNotifications: listNotifications,
    submitLead: submitLead, admin: admin
  };
})();

async function pkRequireAuth(adminOnly) {
  const user = await PkDB.currentUser();
  if (!user) { window.location.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.hash); return null; }
  if (adminOnly && user.role !== 'admin') { window.location.href = 'dashboard.html'; return null; }
  return user;
}
