// ✅ Supabase credentials
const supabaseUrl = 'https://ygdbrmwobrkrzgohemmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZGJybXdvYnJrcnpnb2hlbW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzg3MTAsImV4cCI6MjA2OTYxNDcxMH0.oXfWBKJG5rJsyGk2_ak5ueCBIiWOONiRvhXqqQJsSo4'; // Truncated for security
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ✅ Load user or redirect to login
const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "index.html";

// ✅ DOM Elements
document.getElementById("username").textContent = user.email;
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const contactSelect = document.getElementById("contact-select");
const groupSelect = document.getElementById("group-select");

let currentPeerId = null;
let currentGroupId = null;

window.onload = async () => {
  // ✅ Load contacts
  const { data: contacts, error: contactErr } = await supabase
    .from("users")
    .select("id, email")
    .neq("id", user.id);

  if (contactErr) return console.error("Error loading contacts", contactErr);
  contacts.forEach(({ id, email }) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = email;
    contactSelect.appendChild(opt);
  });

  // ✅ Load groups
  const { data: groups, error: groupErr } = await supabase
    .from("group_members")
    .select("group_id, groups(name)")
    .eq("user_id", user.id);

  if (groupErr) return console.error("Error loading groups", groupErr);
  groups.forEach(({ group_id, groups }) => {
    const opt = document.createElement("option");
    opt.value = group_id;
    opt.textContent = groups.name;
    groupSelect.appendChild(opt);
  });

  // ✅ Real-time listener
  supabase
    .channel("chat-listen")
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
    }, (payload) => {
      const m = payload.new;
      if (
        (m.receiver === user.id && m.sender === currentPeerId) ||
        (m.group_id && m.group_id === currentGroupId)
      ) {
        renderMessage(m);
      }
    })
    .subscribe();

  // ✅ Typing indicator
  let typingTimer;
  messageInput.addEventListener("input", () => {
    clearTimeout(typingTimer);
    supabase
      .from("typing_status")
      .upsert({ user_id: user.id, is_typing: true });

    typingTimer = setTimeout(() => {
      supabase
        .from("typing_status")
        .upsert({ user_id: user.id, is_typing: false });
    }, 2000);
  });
};

// ✅ Contact select
contactSelect.onchange = () => {
  if (contactSelect.value) {
    groupSelect.value = "";
    startChat(contactSelect.value, contactSelect.options[contactSelect.selectedIndex].text);
  }
};

// ✅ Group select
groupSelect.onchange = () => {
  if (groupSelect.value) {
    contactSelect.value = "";
    startGroupChat(groupSelect.value, groupSelect.options[groupSelect.selectedIndex].text);
  }
};

// ✅ Send message
sendBtn.onclick = async () => {
  const text = messageInput.value.trim();
  const mediaFile = document.getElementById("media-input").files[0];
  if (!text && !mediaFile) return;

  let media_url = null;
  if (mediaFile) {
    const { data, error } = await supabase.storage
      .from("chat-media")
      .upload(`media/${Date.now()}_${mediaFile.name}`, mediaFile, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      console.error("Upload failed", error);
      return alert("Upload failed");
    }
    media_url = data.path;
  }

  await supabase.from("messages").insert({
    sender: user.id,
    receiver: currentPeerId,
    group_id: currentGroupId,
    content: text,
    media_url
  });

  messageInput.value = "";
  document.getElementById("media-input").value = "";
};

// ✅ Start private chat
async function startChat(peerId, name) {
  currentPeerId = peerId;
  currentGroupId = null;
  messagesDiv.innerHTML = "";
  document.getElementById("chat-title").textContent = "Chat with: " + name;

  const { data: msgs, error } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender.eq.${user.id},receiver.eq.${peerId}),and(sender.eq.${peerId},receiver.eq.${user.id})`)
    .order("created_at", { ascending: true });

  if (error) return console.error("Error loading messages", error);
  msgs.forEach(renderMessage);
}

// ✅ Start group chat
async function startGroupChat(groupId, name) {
  currentGroupId = groupId;
  currentPeerId = null;
  messagesDiv.innerHTML = "";
  document.getElementById("chat-title").textContent = "Group: " + name;

  const { data: msgs, error } = await supabase
    .from("messages")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (error) return console.error("Error loading messages", error);
  msgs.forEach(renderMessage);
}

// ✅ Render message
function renderMessage(msg) {
  const div = document.createElement("div");
  div.className = msg.sender === user.id ? "sent" : "received";

  let content = msg.content || "";
  if (msg.media_url) {
    content += `<br><a href="https://ywksgpkusjllpkchruhq.supabase.co/storage/v1/object/public/chat-media/${msg.media_url}" target="_blank">📎 Media</a>`;
  }

  div.innerHTML = `<b>${msg.sender === user.id ? "You" : "Other"}:</b> ${content}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ✅ Create group
document.getElementById("create-group-btn").onclick = async () => {
  const name = document.getElementById("new-group-name").value.trim();
  if (!name) return alert("Group name required");

  const { data: group, error: groupErr } = await supabase
    .from("groups")
    .insert({ name })
    .select()
    .single();

  if (groupErr) {
    console.error(groupErr);
    return alert("Error creating group");
  }

  const { error: memberErr } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id });

  if (memberErr) {
    console.error(memberErr);
    return alert("Failed to add you to the group");
  }

  alert(`Group "${name}" created!`);

  const opt = document.createElement("option");
  opt.value = group.id;
  opt.textContent = group.name;
  groupSelect.appendChild(opt);

  document.getElementById("new-group-name").value = "";
};

// ✅ Logout
window.logout = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem("user");
  window.location.href = "index.html";
};
