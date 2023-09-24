<script>
  import { createForm } from 'svelte-forms-lib'
  import CheckBox from '../components/CheckBox.svelte'
  import Card from '../components/Card.svelte'
  import Backbutton from '../components/Backbutton.svelte'
  import {
    decryptHashedWord,
    generateHashedWord,
    parseArrayBuffer,
    stringifyArrayBuffer,
  } from '../utils'

  let isSubmitted = false
  let initialValues = {
    username: '',
    password: '',
    goToFirstSchoolAutomatically: false,
  }

  const { form, errors, handleChange, handleSubmit } = createForm({
    initialValues,
    onSubmit: async (values) => {
      const hashedUsername = await generateHashedWord(values.username)
      const hashedPasssword = await generateHashedWord(values.password)

      const newValues = {
        username: stringifyArrayBuffer(hashedUsername),
        password: stringifyArrayBuffer(hashedPasssword),
        goToFirstSchoolAutomatically: !!values.goToFirstSchoolAutomatically,
      }

      await chrome.storage.local.set(newValues)
      await chrome.storage.local.remove('credentialsError')

      isSubmitted = true
    },
    validate: (values) => {
      let errs = {}
      if (values.username === '') {
        errs['username'] = 'Username is required'
      }
      if (values.password === '') {
        errs['password'] = 'Password is required'
      }
      return errs
    },
  })
  ;(async () => {
    try {
      const { username, password, goToFirstSchoolAutomatically } = await chrome.storage.local.get()

      console.log(await decryptHashedWord(parseArrayBuffer(username)))
      if (username) {
        const decryptedUsername = await decryptHashedWord(parseArrayBuffer(username)).catch(
          (error) => console.error('Error decrypting username:', error),
        )
        $form.username = decryptedUsername
      }

      if (password) {
        const decryptedPassword = await decryptHashedWord(parseArrayBuffer(password)).catch(
          (error) => console.error('Error decrypting password:', error),
        )
        $form.password = decryptedPassword
      }

      $form.goToFirstSchoolAutomatically = goToFirstSchoolAutomatically
    } catch (error) {
      console.error('Error retrieving data from storage:', error)
    }
  })()
</script>

<main>
  {#if isSubmitted}
    <div class="container"><Backbutton on:click={() => (isSubmitted = false)} /><Card /></div>
  {:else}
    <form on:submit={handleSubmit} class="container">
      <div class="input-container">
        <div class="input-content">
          <div class="input-dist">
            <span id="title">Options</span>
            <div class="input-type">
              <input
                placeholder="Username"
                required=""
                type="text"
                class="input-is"
                name="username"
                on:change={handleChange}
                bind:value={$form.username}
              />
              {#if $errors.username}
                <small class="error">{$errors.username}</small>
              {/if}
              <input
                name="password"
                placeholder="Password"
                required=""
                type="password"
                class="input-is"
                on:change={handleChange}
                bind:value={$form.password}
              />
              {#if $errors.password}
                <small class="error">{$errors.password}</small>
              {/if}

              <div style="padding-left: 0.4em;">
                <CheckBox
                  on:change={handleChange}
                  name="goToFirstSchoolAutomatically"
                  bind:checked={$form.goToFirstSchoolAutomatically}
                  placeholder="Directly redirect to first school in schools list"
                />
              </div>
            </div>

            <div class="subTxt-container">
              <span class="subTxt"
                >FYI: sensitive infos are safely stored in the chrome storage and cannot be leaked</span
              >
            </div>

            <button>Submit</button>
          </div>
        </div>
      </div>
    </form>
  {/if}
</main>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
      'Open Sans', 'Helvetica Neue', sans-serif;
  }
  :global(body) {
    background-color: #001d3d;
    color: #fff;
    max-height: 100vh;
  }
  main {
    padding-top: 10em;
  }

  #title {
    font-size: 20px;
    color: #2faed8;
    padding-bottom: 0.5em;
  }

  .error {
    color: red;
    text-align: left;
    font-size: 13px;
    padding-left: 2em;
  }

  .subTxt-container {
    width: 100%;
    text-align: center;
    padding-top: 1.5em;
  }
  .subTxt {
    font-size: 14px;
    color: #9e30a9;
    overflow-wrap: break-word;
    max-width: 30em;
  }

  button {
    color: #9fc4d0;
    text-decoration: none;
    font-size: 25px;
    border: none;
    background: none;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    margin: 10px 0 0;
  }

  button::before {
    margin-left: auto;
  }

  button::after,
  button::before {
    content: '';
    width: 0%;
    height: 2px;
    background: #06aed8;
    display: block;
    transition: 0.5s;
  }

  button:hover::after,
  button:hover::before {
    width: 100%;
  }

  .container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-style: italic;
    font-weight: bold;
    display: flex;
    margin: auto;
    align-items: center;
    justify-items: center;
    justify-content: center;
    flex-wrap: wrap;
    flex-direction: column;
    gap: 1em;
    max-width: 40em;
    width: calc(100% - 20px);
  }

  .input-container {
    filter: drop-shadow(46px 36px 24px #4090b5) drop-shadow(-55px -40px 25px #9e30a9);
    animation: blinkShadowsFilter 8s ease-in infinite;
  }

  .input-content {
    display: grid;
    align-content: center;
    justify-items: center;
    align-items: center;
    text-align: center;
    padding-inline: 1em;
  }

  .input-content::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    filter: blur(40px);
    -webkit-clip-path: polygon(
      26% 0,
      66% 0,
      92% 0,
      100% 8%,
      100% 89%,
      91% 100%,
      7% 100%,
      0 92%,
      0 0
    );
    clip-path: polygon(26% 0, 66% 0, 92% 0, 100% 8%, 100% 89%, 91% 100%, 7% 100%, 0 92%, 0 0);
    background: rgba(122, 251, 255, 0.5568627451);
    transition: all 1s ease-in-out;
  }

  .input-content::after {
    content: '';
    position: absolute;
    width: 98%;
    height: 98%;
    box-shadow: inset 0px 0px 20px 20px #212121;
    background: repeating-linear-gradient(
        to bottom,
        transparent 0%,
        rgba(64, 144, 181, 0.6) 1px,
        rgb(0, 0, 0) 3px,
        hsl(295, 60%, 12%) 5px,
        #153544 4px,
        transparent 0.5%
      ),
      repeating-linear-gradient(to left, hsl(295, 60%, 12%) 100%, hsla(295, 60%, 12%, 0.99) 100%);
    -webkit-clip-path: polygon(
      26% 0,
      31% 5%,
      61% 5%,
      66% 0,
      92% 0,
      100% 8%,
      100% 89%,
      91% 100%,
      7% 100%,
      0 92%,
      0 0
    );
    clip-path: polygon(
      26% 0,
      31% 5%,
      61% 5%,
      66% 0,
      92% 0,
      100% 8%,
      100% 89%,
      91% 100%,
      7% 100%,
      0 92%,
      0 0
    );
    animation: backglitch 50ms linear infinite;
  }

  .input-dist {
    z-index: 80;
    display: grid;
    align-items: center;
    text-align: center;
    width: 100%;
    padding-inline: 1em;
    padding-block: 1.2em;
    grid-template-columns: 1fr;
  }

  .input-type {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    gap: 1em;
    font-size: 1.1rem;
    background-color: transparent;
    width: 100%;
    border: none;
  }

  .input-is {
    color: #fff;
    font-size: 0.9rem;
    background-color: transparent;
    width: 100%;
    box-sizing: border-box;
    padding-inline: 0.5em;
    padding-block: 0.7em;
    border: none;
    transition: all 1s ease-in-out;
    border-bottom: 1px solid hsl(221, 26%, 43%);
  }

  .input-is:hover {
    transition: all 1s ease-in-out;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(102, 224, 255, 0.2) 27%,
      rgba(102, 224, 255, 0.2) 63%,
      transparent 100%
    );
  }

  .input-content:focus-within::before {
    transition: all 1s ease-in-out;
    background: hsla(0, 0%, 100%, 0.814);
  }

  .input-is:focus {
    outline: none;
    border-bottom: 1px solid hsl(192, 100%, 100%);
    color: hsl(192, 100%, 88%);
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(102, 224, 255, 0.2) 27%,
      rgba(102, 224, 255, 0.2) 63%,
      transparent 100%
    );
  }

  .input-is::-moz-placeholder {
    color: hsla(192, 100%, 88%, 0.806);
  }

  .input-is::placeholder {
    color: hsla(192, 100%, 88%, 0.806);
  }

  @keyframes backglitch {
    0% {
      box-shadow: inset 0px 20px 20px 30px #212121;
    }

    50% {
      box-shadow: inset 0px -20px 20px 30px hsl(297, 42%, 10%);
    }

    to {
      box-shadow: inset 0px 20px 20px 30px #212121;
    }
  }

  @keyframes rotate {
    0% {
      transform: rotate(0deg) translate(-50%, 20%);
    }

    50% {
      transform: rotate(180deg) translate(40%, 10%);
    }

    to {
      transform: rotate(360deg) translate(-50%, 20%);
    }
  }

  @keyframes blinkShadowsFilter {
    0% {
      filter: drop-shadow(46px 36px 28px rgba(64, 144, 181, 0.3411764706))
        drop-shadow(-55px -40px 28px #9e30a9);
    }

    25% {
      filter: drop-shadow(46px -36px 24px rgba(64, 144, 181, 0.8980392157))
        drop-shadow(-55px 40px 24px #9e30a9);
    }

    50% {
      filter: drop-shadow(46px 36px 30px rgba(64, 144, 181, 0.8980392157))
        drop-shadow(-55px 40px 30px rgba(159, 48, 169, 0.2941176471));
    }

    75% {
      filter: drop-shadow(20px -18px 25px rgba(64, 144, 181, 0.8980392157))
        drop-shadow(-20px 20px 25px rgba(159, 48, 169, 0.2941176471));
    }

    to {
      filter: drop-shadow(46px 36px 28px rgba(64, 144, 181, 0.3411764706))
        drop-shadow(-55px -40px 28px #9e30a9);
    }
  }
</style>
