
const socket = io()
const clog = console.log
// Elements
const $messageForm           = document.querySelector("#message-form") 
const $messageFormInput      = $messageForm.querySelector("input")
const $messageFormButton     = $messageForm.querySelector("button")
const $shareLocationButton   = document.querySelector('#share-location')
const $messages              = document.querySelector("#messages")

// Elements ends

// Options

const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})  

// Options End


// Templates
const messageTemplate          = document.querySelector('#message-template').innerHTML
const locationMessageTemplate  = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate          = document.querySelector('#sidebar-template').innerHTML

// Templates ends

const autoScroll = () => {
   // new message element
   const $newMessage = $messages.lastElementChild

   // height of the new message
   const newMessageStyles = getComputedStyle($newMessage)
   const newMessageMargin = parseInt(newMessageStyles.marginBottom)
   const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
   
   // Visible height
   const visibleHeight =  $messages.offsetHeight

   // Height of messages container
   const containerHeight = $messages.scrollHeight

   // how far have I scrolled?
   const scrollOffset = $messages.scrollTop + visibleHeight

   if ( containerHeight - newMessageHeight >= scrollOffset ) {
       $messages.scrollTop =  $messages.scrollHeight
   }

}
socket.on('message', (message) => {
    clog(message)
    clog('='.repeat(60))
    const html = Mustache.render(messageTemplate, { 
                 username: message.username,
                 message: message.text,
                 createdAt: moment(message.createdAt).format('h:mm a') })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
});


socket.on('locationMessage', (message) => {
    clog(message)
    const html = Mustache.render(locationMessageTemplate, {
                 username: message.username,
                 url: message.url,
                 createdAt: moment(message.createdAt).format('h:mm a')  })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
});

socket.on('roomData', ( {room, users}) => {
   const html = Mustache.render(sidebarTemplate, {
       room,
       users
   });

   document.querySelector("#sidebar").innerHTML = html
})


$messageForm.addEventListener('submit', (event) => {
    event.preventDefault()
    
    $messageFormButton.setAttribute('disabled', 'disabled')

    const msg = event.target.elements.message 
    socket.emit('sendMessage', msg.value, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if ( error ) {
           return clog(error)
        }
        clog('Message delivered successfully!!')
    })
});


$shareLocationButton.addEventListener('click', () => {
    if ( !navigator.geolocation ) {
        return alert('Your browser does not support Geolocation')
    }
    
    $shareLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition( (position) => {
       const latitude = position.coords.latitude
       const longitude = position.coords.longitude
       socket.emit('shareLocation', {latitude,  longitude }, () => {
         clog('Location shared successfully!!') 
         $shareLocationButton.removeAttribute('disabled')      
       })
    })
});


socket.emit('join', { username, room}, (error) => {
    if (error) {
        alert(error)
        location.href= '/'
    } 
})