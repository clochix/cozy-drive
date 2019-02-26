/* global cozy */

import React, { Component } from 'react'
import { connect } from 'react-redux'
import Proptypes from 'prop-types'
import MobileRouter from 'authentication/MobileRouter'
import AppRoute from 'drive/web/modules/navigation/AppRoute'
import { setToken } from 'drive/mobile/modules/authorization/duck'
import { setUrl } from 'drive/mobile/modules/settings/duck'
import {
  restoreCozyClientJs,
  initBar,
  updateBarAccessToken
} from 'drive/mobile/lib/cozy-helper'
import { IconSprite } from 'cozy-ui/transpiled/react/'
import {
  unlink,
  isAuthorized,
  isRevoked,
  getOnboardingInformations
} from './duck/index'
import { saveCredentials } from './sagas'
import { setCozyUrl } from 'drive/lib/reporter'

class DriveMobileRouter extends Component {
  afterAuthentication = async ({ url, clientInfo, token, router }) => {
    console.log('afterAuthentication')
    const wasRevoked = this.props.isRevoked
    this.context.client.options.uri = url

    const accesstoken = new cozy.client.auth.AccessToken(token)

    //const accesstoken = new AccessToken(token)
    await restoreCozyClientJs(url, clientInfo, token)
    console.log('va init la bar', this.context.client)
    await initBar(this.context.client)

    this.props.saveServerUrl(url)
    setCozyUrl(url)
    this.props.saveCredentials(clientInfo, accesstoken)
    const oauthClient = this.context.client.getStackClient()
    oauthClient.setCredentials(token)
    oauthClient.setUri(url)
    oauthClient.onTokenRefresh = () => {
      updateBarAccessToken(token.accessToken)
      restoreCozyClientJs(url, clientInfo, token)
      this.props.dispatch(setToken(token))
    }

    if (wasRevoked) {
      await initBar(this.context.client)
      router.replace('/')
    } else {
      router.replace('/onboarding')
    }
    return true
  }

  afterLogout = () => {
    this.props.unlink(this.context.client)
  }

  render() {
    const {
      isAuthenticated,
      isRevoked,
      appRoutes,
      history,
      onboarding,
      onboardingInformations
    } = this.props
    console.log('render DriveMobileRouter')
    return (
      <div style={{ flex: '1' }}>
        <MobileRouter
          isAuthenticated={isAuthenticated}
          isRevoked={isRevoked}
          appRoutes={appRoutes}
          history={history}
          onAuthenticated={this.afterAuthentication}
          onLogout={this.afterLogout}
          allowRegistration={false}
          appIcon={require('../../../../../src/drive/targets/vendor/assets/apple-touch-icon-180x180.png')}
          onboarding={onboarding}
          onboardingInformations={onboardingInformations}
          client={this.context.client}
        />
        <IconSprite />
      </div>
    )
  }
}
DriveMobileRouter.propTypes = {
  onboarding: Proptypes.object,
  isAuthenticated: Proptypes.bool.isRequired,
  isRevoked: Proptypes.bool.isRequired,
  appRoutes: Proptypes.object.isRequired,
  history: Proptypes.object.isRequired
}
const DriveMobileRouterWithRoutes = props => (
  <DriveMobileRouter {...props} appRoutes={AppRoute} />
)

const mapStateToProps = state => ({
  isAuthenticated: isAuthorized(state),
  isRevoked: isRevoked(state),
  onboardingInformations: getOnboardingInformations(state)
})

const mapDispatchToProps = dispatch => ({
  saveServerUrl: url => dispatch(setUrl(url)),
  saveCredentials: (clientInfo, token) =>
    dispatch(saveCredentials(clientInfo, token)),
  unlink: client => dispatch(unlink(client))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DriveMobileRouterWithRoutes)
