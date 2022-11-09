
      const CLIENT_ID = '640757938580-h3dbb39rn36lknia3jabu0867kagsorh.apps.googleusercontent.com';
      const API_KEY = 'AIzaSyAvhEzqj2UIV843DlKmX4y0qEUUwIcgEqg';

      const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

      const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

      let tokenClient;
      let gapiInited = false;
      let gisInited = false;

      // document.getElementById('authorize_button').style.visibility = 'hidden';
      document.getElementById('signout_button').style.visibility = 'hidden';
      document.getElementById('ref_button').style.visibility = 'hidden';


    // Callback after api.js is loaded.
       
      function gapiLoaded() {
        gapi.load('client', initializeGapiClient);
      }


  //     * Callback after the API client is loaded. Loads the discovery doc to initialize the API.

        async function initializeGapiClient() {
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        maybeEnableButtons();
      }

       // Callback after Google Identity Services are loaded.

      function gisLoaded() {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // defined later
        });
        gisInited = true;
        maybeEnableButtons();
      }

      // Enables user interaction after all libraries are loaded.
      function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
     }
      async function maybeEnableButtons() {
        if (gapiInited && gisInited) {
          // document.getElementById('authorize_button').style.visibility = 'visible';

         console.log("Test 1")
          handleAuthClick();
        }
      }
      document.getElementById('ref_button').addEventListener("click",async ()=>
      {
        await displayInbox();
      })
    //   *  Sign in the user upon button click.

      function handleAuthClick() {
        tokenClient.callback = async (resp) => {
          if (resp.error !== undefined) {
            throw (resp);
          }
          document.getElementById('signout_button').style.visibility = 'visible';
          document.getElementById('ref_button').style.visibility = 'visible';
          // document.getElementById('authorize_button').innerText = 'Refresh';
       // Call display function here
      

       await displayInbox();

        //    await listLabels();
        };

        if (gapi.client.getToken() === null) {
          // Prompt the user to select a Google Account and ask for consent to share their data 
          //when establishing a new session.
          tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
          // Skip display of account chooser and consent dialog for an existing session.
          tokenClient.requestAccessToken({prompt: ''});
        }
      }

      
    //   Sign out the user upon button click.
    
      function handleSignoutClick() {
        const token = gapi.client.getToken();
        if (token !== null) {
          google.accounts.oauth2.revoke(token.access_token);
          gapi.client.setToken('');
          document.getElementById('content').innerText = '';
          // document.getElementById('authorize_button').innerText = 'Authorize';
          document.getElementById('signout_button').style.visibility = 'hidden';
        }
      }

      
      //  Print all Labels in the authorized user's inbox. If no labels
      //  are found an appropriate message is printed.
      async function displayInbox() {
        var request = gapi.client.gmail.users.messages.list({
          'userId': 'me',
          'labelIds': 'INBOX',
          'maxResults': 1
        });
        
        request.execute(function(response) {
        const arr=[];
       
        for(var i=0;i<response.messages.length;i++)
        {
            arr.push(response.messages[i]);
        }
        
        arr.forEach(msgReqFunc);
        function msgReqFunc(item){
              var messageRequest = gapi.client.gmail.users.messages.get({
                'userId': 'me',
                'id': item.id
              });
              console.log("calling append msg");
             messageRequest.execute(appMsg);
            }
          });
          
        // request.execute(function(response) {
        //   $.each(response.messages, function() {
        //     var messageRequest = gapi.client.gmail.users.messages.get({
        //       'userId': 'me',
        //       'id': this.id
        //     });
      
        //     messageRequest.execute(appendMessageRow);
        //   });
        // });
      }
    //   function appendMessageRow(message) {
    //     document.getElementById('content').append(
    //       '<tr>\
    //         <td>'+getHeader(message.payload.headers, 'From')+'</td>\
    //         <td>'+getHeader(message.payload.headers, 'Subject')+'</td>\
    //         <td>'+getHeader(message.payload.headers, 'Date')+'</td>\
    //       </tr>'
    //     );
    //   }
      function getHeader(headers, index) {
        var header = '';

        headers.foreach( function(){
          if(this.name === index){
            header = this.value;
          }
        });
        return header;
      }
      
      async function appMsg(message)
      {
        var htmlBody = getBody(message.payload)
        console.log(htmlBody);
        
        //message.payload.parts.body.data is the encoded email body text, needs to be decoded by decodeURIcomponent()
        //to get the content to index.html document page:

        var content = document.getElementById('content');
        content.innerHTML = htmlBody;
      } 

        
      async function listLabels() {
        let response;
        try {
          response = await gapi.client.gmail.users.labels.list({
            'userId': 'me',
          });
//          console.log(" Response : "+response)
        } catch (err) {
          document.getElementById('content').innerText = err.message;
          return;
        }
        const labels = response.result.labels;
        if (!labels || labels.length == 0) {
          document.getElementById('content').innerText = 'No labels found.';
          return;
        }
        // Flatten to string to display
        const output = labels.reduce(
            (str, label) => `${str}${label.name}\n`,'Labels:\n');
        document.getElementById('content').innerText = output;
        console.log(output);
      }

      function getBody(message) {
        var encodedBody = '';
        if(typeof message.parts === 'undefined')
        {
          encodedBody = message.body.data;
        }
        else
        {
          encodedBody = getHTMLPart(message.parts);
         // console.log("Encoded body after getHtmlPart "+encodedBody)
        }
        encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
        return decodeURIComponent(escape(window.atob(encodedBody)));
      }

      function getHTMLPart(arr) {
        for(var x = 0; x <= arr.length; x++)
        {
          if(typeof arr[x].parts === 'undefined')
          {
            if(arr[x].mimeType === 'text/html')
            {
              return arr[x].body.data;
            }
          }
          else
          {
            return getHTMLPart(arr[x].parts);
          }
        }
        return '';
      }