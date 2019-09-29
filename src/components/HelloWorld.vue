<template>
  <section>
    <v-parallax src="http://www.milliondollarluxe.com/wp-content/uploads/2015/11/gray-wallpaper-21.jpg" height="1200" width="1700">
      <v-layout column align-center justify-center class="white--text">
        <h1 class="black--text mb-2 display-1 text-xs-center" style="font-weight: 900; text-shadow: 3px 2px #FFFFFF">This is simple site</h1>
        <div class="black--text subheading mb-3 text-xs-center" style="font-weight: 900; text-shadow: 2px 2px #FFFFFF">Powered by kkaminsky and iishimtsev</div>
        <v-btn class="lighten-2 mt-5" dark large to="/usercabinet">
          Get Started
        </v-btn>
      </v-layout>
    </v-parallax>
  </section>
</template>

<script>
  export default {
    data: () => ({
      ecosystem: [
        {
          text: 'vuetify-loader',
          href: 'https://github.com/vuetifyjs/vuetify-loader'
        },
        {
          text: 'github',
          href: 'https://github.com/vuetifyjs/vuetify'
        },
        {
          text: 'awesome-vuetify',
          href: 'https://github.com/vuetifyjs/awesome-vuetify'
        }
      ],
      importantLinks: [
        {
          text: 'Documentation',
          href: 'https://vuetifyjs.com'
        },
        {
          text: 'Chat',
          href: 'https://community.vuetifyjs.com'
        },
        {
          text: 'Made with Vuetify',
          href: 'https://madewithvuetifyjs.com'
        },
        {
          text: 'Twitter',
          href: 'https://twitter.com/vuetifyjs'
        },
        {
          text: 'Articles',
          href: 'https://medium.com/vuetify'
        }
      ],
      whatsNext: [
        {
          text: 'Explore components',
          href: 'https://vuetifyjs.com/components/api-explorer'
        },
        {
          text: 'Select a layout',
          href: 'https://vuetifyjs.com/layout/pre-defined'
        },
        {
          text: 'Frequently Asked Questions',
          href: 'https://vuetifyjs.com/getting-started/frequently-asked-questions'
        }
      ]
    })
  }
</script>

<style>
</style>
