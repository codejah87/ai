
const chatsContainer = document.querySelector('.chat-container');
const container = document.querySelector('.container');
const promptForm = document.querySelector('.prompt-form');
const promptInput = document.querySelector('.prompt-input');
const fileInput = document.querySelector('#file-input');
const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
const themeToggle = document.querySelector('#light_mode');

const API_KEY = 'AIzaSyD_TPlVuoXhFRMGYHlDQjbOGBFpb-zHWXc'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`
let typingInterval, contoller;
const chatHistory = [];
let userData = {message: "", file: {}};


const createMsgElement = (content, ...classes) => {
    const div = document.createElement('div');
    div.classList.add('message', ...classes)
    div.innerHTML = content;
    return div
}

const scrollToBottom = () => {
    container.scrollTo({top:container.scrollHeight, behavior: 'smooth'});
}

function typingEffect(text, textElement, botmsgDiv){
    textElement.textContent = '';
    const word = text.split(' ');
    let wordIndex = 0;
   typingInterval = setInterval(() => {
        if(wordIndex < word.length) {
            textElement.textContent += word[wordIndex] + ' ';
            wordIndex++;
    scrollToBottom()

        } else {
            clearInterval(typingInterval);
            botmsgDiv.classList.remove('loading');
            document.body.classList.remove('bot-responding');

        } 
    },40)

}

const generateResponse = async (botmsgDiv) => {
const textElement = botmsgDiv.querySelector('.message-text')
   contoller = new AbortController();
    chatHistory.push({
        role: 'user',
        parts : [{ text: userData.message}, ...(userData.file.data ? [{inline_data: (({ fileName, isImage, ...rest}) => rest) (userData.file) }] : [])]
    });

    try {
        const response  = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',  },
                 body: JSON.stringify({contents: chatHistory}),
                 signal: contoller.signal
        });
        const data = await response.json();  
        if(!response.ok) {
            throw new Error(data.error.message || 'Something went wrong');
        }
      const responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim()
      

      typingEffect(responseText,textElement,botmsgDiv)

    chatHistory.push({
        role: 'model',
        parts : [{ text: responseText}]
    });

    
    } catch (error) {
        textElement.style.color = 'red';
      textElement.textContent = error.name === 'AbortError' ? "Response generation stopped." : error.message;
    botmsgDiv.classList.remove('loading');
    document.body.classList.remove('bot-responding');
        console.log(error.message);
        
    }finally{
        userData.file = {};
    }
} 


const handleFormSubmit = (e) => {
    e.preventDefault();
  const userMessage = promptInput.value.trim()

    if(!userMessage || document.body.classList.contains('bot-responding')) return;
    
    promptInput.value = "";
    userData.message = userMessage;
    document.body.classList.add('bot-responding', 'chat-active');
    fileUploadWrapper.classList.remove('active', 'img-attached', 'file-attached');

    const userMsfHTML = ` <p class="message-text"></p>
     ${userData.file.data ? (userData.file.isImage ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class ="img-attachment">` :
       ` <p class="file-attachment">
        <span class="material-symbols-outlined">description</span> ${userData.file.fileName}</p>`) : ""}
    `;     
    const usermsgDiv = createMsgElement(userMsfHTML, 'user-message');
    usermsgDiv.querySelector('.message-text').textContent = userMessage;

    chatsContainer.appendChild(usermsgDiv);



    scrollToBottom()
    setTimeout(()=> {
    const botMsfHTML = ` <img src="./img.jpg" class="avatar"> <p class="message-text">just a sec..</p>`;     
    const botmsgDiv = createMsgElement(botMsfHTML, 'bot-message', 'loading');
    usermsgDiv.querySelector('.message-text').textContent = userMessage;

    chatsContainer.appendChild(botmsgDiv);
    scrollToBottom()
    generateResponse(botmsgDiv);
    },600)
}

fileInput.addEventListener('change', ()=> {
    const file = fileInput.files[0];

    if(!file) return;

    const isImage = file.type.startsWith("image/")
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
        fileInput.value = '';
        const base64String = e.target.result.split(',')[1]
        fileUploadWrapper.querySelector('.file-preview').src = e.target.result;

        fileUploadWrapper.classList.add('active', isImage ? "img-attached" : "file-attached");


        userData.file = {
            fileName: file.name,
            data: base64String,
            mime_type: file.type,
            isImage
        }
    }
})


document.querySelector('#cancle-file-btn').addEventListener('click', () => {
    userData.file ={}
    fileUploadWrapper.classList.remove('active', 'img-attached', 'file-attached');
    // fileUploadWrapper.querySelector('.file-preview').src = '';
});



document.querySelector('#stop-response-btn').addEventListener('click', () => {
    userData.file ={}
    contoller?.abort();
    clearInterval(typingInterval);
    chatsContainer.querySelector('.bot-message.loading').classList.remove('loading');
    document.body.classList.remove('bot-responding');
});

// Delete all chat
document.querySelector('#delete_btn').addEventListener('click', () => {
    chatHistory.length = 0;
    chatsContainer.innerHTML = '';
    document.body.classList.remove('bot-responding', 'chat-active')
});


document.querySelectorAll('.sugestion-item').forEach(item => {
   item.addEventListener('click', () => {
    promptInput.value = item.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event('submit'));
   })
})

document.addEventListener('click', ({target}) => {
    const wrapper = document.querySelector('.prompt-wrapper');
    const shouldHide = target.classList.contains('prompt-input') || (wrapper.classList.contains('hide-controls') && target.id === 'add-file-btn' || target.id === 'stop-response-btn');
    wrapper.classList.toggle('hide-controls', shouldHide);
})

themeToggle.addEventListener('click', () => {
    const isLightTheme = document.body.classList.toggle("light-theme");
    localStorage.setItem('themeColor', isLightTheme ? 'light_mode ' : 'dark_mode')
    themeToggle.textContent = isLightTheme ? 'dark_mode' : 'light_mode';
});


    const isLightTheme = localStorage.getItem('themeColor') === 'light_mode';
    document.body.classList.toggle("light-theme", isLightTheme);
    themeToggle.textContent = isLightTheme ? 'dark_mode' : 'light_mode';


promptForm.addEventListener('submit', handleFormSubmit);


promptForm.querySelector('#add-file-btn').addEventListener('click', () => fileInput.click())
