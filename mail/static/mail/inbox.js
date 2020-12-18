document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#id-view').style.display = 'none'
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Send email via POST
  document.querySelector('#compose-form').onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
    })
  })
    .then( () => {
      load_mailbox('sent');
    });
    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#id-view').style.display = 'none'

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Get the emails and show them depending on the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // For each email create a new div and append to specific mailbox
    emails.forEach((email) => {
      const element = document.createElement('div');
      element.innerHTML = `<div> <b>${email.sender}</b> | ${email.subject} | ${email.timestamp}</div>` 
      if (mailbox === 'sent') {
        element.className = "read btn-outline-dark"
        element.innerHTML = `<div> To: <b>${email.recipients}</b> | ${email.subject} | ${email.timestamp}</div>`
      }
      else if (mailbox === 'inbox') {
        // Check if email is read or unread
        if (email.read === true) {
          element.className = "read btn-outline-dark"
        }
        else {
          element.className = "unread btn-outline-dark"
        } 
      }  
      else if (mailbox === "archive") {
        element.className = "read btn-outline-dark"
        element.innerHTML = `<div> <b>${email.sender}</b> | ${email.subject} | ${email.timestamp}</div>`
      }
      document.querySelector("#emails-view").append(element)

      // Run function show_mail when email is clicked
      element.addEventListener('click', () => {
        show_mail(email.id)
      });
    });
  });  
}

function show_mail(id) {

  // Fetch the email clicked on through their id
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    // Create new view, div and buttons then display the email in it
    document.querySelector("#id-view").innerHTML = '';
    const element = document.createElement('div');
    element.className = "show"
    if (email.archived === false) {
      element.innerHTML = `<div> <p><b>From:</b> ${email.sender}</p> <p><b>To:</b> ${email.recipients} </p> <p><b>Subject:</b> ${email.subject}</p>
    <p><b>Timestamp:</b> ${email.timestamp} </p> <hr> <p> ${email.body}</p> <hr> <p><button class="archive">Archive</button></p><p><button class="reply">Reply</button></p></div>`
    }
    else {
      element.innerHTML = `<div> <p><b>From:</b> ${email.sender}</p> <p><b>To:</b> ${email.recipients} </p> <p><b>Subject:</b> ${email.subject}</p>
    <p><b>Timestamp:</b> ${email.timestamp} </p> <hr> <p> ${email.body}</p> <hr> <p> <button class="archive">Unarchive</button></p><p><button class="reply">Reply</button></p></div>`
    }

    document.querySelector("#id-view").append(element)

    // Show the mailbox and hide other views
    document.querySelector('#id-view').style.display = 'block'
    document.querySelector('#emails-view').style.display = 'none'
    
    // Run function archive when archive button is clicked on
    element.addEventListener('click', Event => {
      const element = Event.target;
      if (element.className === "archive") {
        console.log(status)
        archive(email.id, email.archived)
      }
    });

    // Run function reply when reply button is clicked on
    element.addEventListener('click', Event => {
      const element = Event.target;
      if (element.className === 'reply') {
        reply(email.id)
      }
    });

    // Run function mark_read when unread email is clicked on
    if (email.read === false){
      mark_read(email.id);
    }
  });
}

function mark_read(id) {

    // Set read attribute to true
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
  });
}

function archive(id, status) {

  // Set archive attribute to the opposite of current status
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: !status
    })
  })
  // Load inbox mailbox
  .then( () => {
    load_mailbox('inbox');
  });
}

function reply(id) {
  
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#id-view').style.display = 'none'
  document.querySelector('#compose-view').style.display = 'block';

  // Get the specific email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(emails => {
    
    // Populate composition fields
    document.querySelector('#compose-recipients').value = emails.sender;
    document.querySelector('#compose-subject').value = `Re: ${emails.subject} `;
    document.querySelector('#compose-body').value = `On ${emails.timestamp} ${emails.recipients} wrote: "${emails.body}."`;
  });
  
    // Send reply via POST
    document.querySelector('#compose-form').onsubmit = () => {
      fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
        })
      })
      .then( () => {
        load_mailbox('sent');
      });
    }
}