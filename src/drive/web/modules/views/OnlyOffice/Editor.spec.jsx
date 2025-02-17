import React from 'react'
import { render, screen } from '@testing-library/react'

import { createMockClient, useQuery } from 'cozy-client'
import useFetchJSON from 'cozy-client/dist/hooks/useFetchJSON'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import AppLike from 'test/components/AppLike'
import { officeDocParam } from 'test/data'

import {
  isOfficeEnabled,
  isOfficeEditingEnabled
} from 'drive/web/modules/views/OnlyOffice/helpers'
import { OnlyOfficeContext } from 'drive/web/modules/views/OnlyOffice/OnlyOfficeProvider'
import Editor from 'drive/web/modules/views/OnlyOffice/Editor'

jest.mock('cozy-client/dist/hooks/useFetchJSON', () => ({
  __esModule: true,
  default: jest.fn(),
  useFetchJSON: jest.fn()
}))

jest.mock('drive/web/modules/views/OnlyOffice/helpers', () => ({
  ...jest.requireActual('drive/web/modules/views/OnlyOffice/helpers'),
  isOfficeEnabled: jest.fn(),
  isOfficeEditingEnabled: jest.fn()
}))

jest.mock('cozy-ui/transpiled/react/providers/Breakpoints', () => ({
  ...jest.requireActual('cozy-ui/transpiled/react/providers/Breakpoints'),
  __esModule: true,
  default: jest.fn(),
  useBreakpoints: jest.fn()
}))

jest.mock('cozy-client/dist/hooks/useQuery', () => jest.fn())

jest.mock('cozy-flags')
jest.mock('drive/web/modules/views/OnlyOffice/Toolbar', () => () => (
  <div>Toolbar</div>
))
jest.mock('cozy-ui/transpiled/react/Viewer', () => () => (
  <div data-testid="ViewerForTest" />
))

const client = createMockClient({})
client.plugins = {
  realtime: {
    subscribe: () => {},
    unsubscribe: () => {}
  }
}

const setup = ({
  isMobile = false,
  isEditorModeView = true,
  isReadOnly = false,
  isPublic = false,
  isTrashed = false
} = {}) => {
  useBreakpoints.mockReturnValue({ isMobile })
  const root = render(
    <AppLike
      client={client}
      routerContextValue={{
        router: { location: { pathname: '/onlyoffice/fileId' } }
      }}
      sharingContextValue={{
        byDocId: {},
        documentType: 'Files'
      }}
    >
      <OnlyOfficeContext.Provider
        value={{
          fileId: '123',
          isPublic,
          isReadOnly,
          isEditorReady: true,
          isEditorModeView,
          officeKey: '321',
          isTrashed,
          setOfficeKey: jest.fn()
        }}
      >
        <Editor />
      </OnlyOfficeContext.Provider>
    </AppLike>
  )

  return { root }
}

describe('Editor', () => {
  afterEach(() => {
    document.body.innerHTML = '' // used to reset document.getElementById(id) present in View
  })

  it('should not show the title but a spinner if the doc is not loaded', () => {
    useFetchJSON.mockReturnValue({ fetchStatus: 'loading', data: undefined })

    const { root } = setup()
    const { queryByTestId } = root

    expect(queryByTestId('onlyoffice-content-spinner')).toBeTruthy()
    expect(queryByTestId('onlyoffice-title')).toBeFalsy()
  })

  it('should not show the title but the CozyUi Viewer instead if stack returns an error', async () => {
    useFetchJSON.mockReturnValue({ fetchStatus: 'error', data: undefined })
    useQuery.mockReturnValue(officeDocParam)

    const { root } = setup()
    const { queryByTestId } = root

    expect(queryByTestId('onlyoffice-content-spinner')).toBeFalsy()
    expect(queryByTestId('onlyoffice-title')).toBeFalsy()
    expect(queryByTestId('ViewerForTest')).toBeTruthy()
  })

  it('should show the title and the container view if the only office server is installed', () => {
    useFetchJSON.mockReturnValue({
      fetchStatus: 'loaded',
      data: officeDocParam
    })
    useQuery.mockReturnValue(officeDocParam)
    isOfficeEnabled.mockReturnValue(true)

    const { root } = setup()
    const { container, queryByTestId } = root

    expect(queryByTestId('onlyoffice-content-spinner')).toBeFalsy()
    expect(queryByTestId('onlyoffice-title')).toBeTruthy()
    expect(container.querySelector('#onlyOfficeEditor')).toBeTruthy()
  })

  it('should show the CozyUi Viewer if the only office server is not installed', () => {
    useFetchJSON.mockReturnValue({
      fetchStatus: 'loaded',
      data: officeDocParam
    })
    useQuery.mockReturnValue(officeDocParam)
    isOfficeEnabled.mockReturnValue(false)

    const { root } = setup()
    const { queryByTestId } = root

    expect(queryByTestId('onlyoffice-content-spinner')).toBeFalsy()
    expect(queryByTestId('onlyoffice-title')).toBeFalsy()
    expect(queryByTestId('ViewerForTest')).toBeTruthy()
  })

  it('should show trashed banner when when the file has been deleted', () => {
    useFetchJSON.mockReturnValue({
      fetchStatus: 'loaded',
      data: officeDocParam
    })
    useQuery.mockReturnValue(officeDocParam)
    isOfficeEnabled.mockReturnValue(true)

    setup({ isMobile: false, isTrashed: true })

    expect(screen.queryByTestId('onlyoffice-title')).toBeTruthy()
    expect(screen.queryByText('The item has been trashed')).toBeInTheDocument()
  })

  describe('Title', () => {
    describe('on mobile', () => {
      it('should hide title when when the editor is in edit mode', () => {
        useFetchJSON.mockReturnValue({
          fetchStatus: 'loaded',
          data: officeDocParam
        })
        useQuery.mockReturnValue(officeDocParam)
        isOfficeEnabled.mockReturnValue(true)

        const { root } = setup({
          isMobile: true,
          isEditorModeView: false
        })
        const { queryByTestId } = root

        expect(queryByTestId('onlyoffice-title')).toBeFalsy()
      })

      it('should show title when when the editor is in view mode', () => {
        useFetchJSON.mockReturnValue({
          fetchStatus: 'loaded',
          data: officeDocParam
        })
        useQuery.mockReturnValue(officeDocParam)
        isOfficeEnabled.mockReturnValue(true)

        const { root } = setup({ isMobile: true })
        const { queryByTestId } = root

        expect(queryByTestId('onlyoffice-title')).toBeTruthy()
      })
    })

    describe('on desktop', () => {
      it('should show title when when the editor is in edit mode', () => {
        useFetchJSON.mockReturnValue({
          fetchStatus: 'loaded',
          data: officeDocParam
        })
        useQuery.mockReturnValue(officeDocParam)
        isOfficeEnabled.mockReturnValue(true)

        const { root } = setup({
          isMobile: false,
          isEditorModeView: false
        })
        const { queryByTestId } = root

        expect(queryByTestId('onlyoffice-title')).toBeTruthy()
      })

      it('should show title when when the editor is in view mode', () => {
        useFetchJSON.mockReturnValue({
          fetchStatus: 'loaded',
          data: officeDocParam
        })
        useQuery.mockReturnValue(officeDocParam)
        isOfficeEnabled.mockReturnValue(true)

        const { root } = setup({ isMobile: false })
        const { queryByTestId } = root

        expect(queryByTestId('onlyoffice-title')).toBeTruthy()
      })
    })
  })

  describe('ReadOnlyFab', () => {
    describe('on mobile', () => {
      it('should show the readOnlyFab', () => {
        useFetchJSON.mockReturnValue({
          fetchStatus: 'loaded',
          data: officeDocParam
        })
        useQuery.mockReturnValue(officeDocParam)
        isOfficeEditingEnabled.mockReturnValue(true)

        setup({ isMobile: true })

        expect(screen.queryByLabelText('Edit')).toBeTruthy()
      })

      it('should show the readOnlyFab', () => {
        useFetchJSON.mockReturnValue({
          fetchStatus: 'loaded',
          data: officeDocParam
        })
        useQuery.mockReturnValue(officeDocParam)
        isOfficeEditingEnabled.mockReturnValue(true)

        setup({ isMobile: true })

        expect(screen.queryByLabelText('Edit')).toBeTruthy()
      })
    })

    describe('on desktop', () => {
      it('should show the readOnlyFab when the editor is in view mode', () => {
        useFetchJSON.mockReturnValue({
          fetchStatus: 'loaded',
          data: officeDocParam
        })
        useQuery.mockReturnValue(officeDocParam)
        isOfficeEditingEnabled.mockReturnValue(true)

        setup({ isMobile: false })

        expect(screen.queryByText('Edit')).toBeTruthy()
      })

      it('should hide the readOnlyFab when the editor is in edit mode', () => {
        useFetchJSON.mockReturnValue({
          fetchStatus: 'loaded',
          data: officeDocParam
        })
        useQuery.mockReturnValue(officeDocParam)
        isOfficeEditingEnabled.mockReturnValue(true)

        setup({ isMobile: false, isEditorModeView: false })

        expect(screen.queryByText('Edit')).toBeFalsy()
      })

      it('should hide the readOnlyFab when the document is in read only', () => {
        useFetchJSON.mockReturnValue({
          fetchStatus: 'loaded',
          data: officeDocParam
        })
        useQuery.mockReturnValue(officeDocParam)
        isOfficeEditingEnabled.mockReturnValue(true)

        setup({
          isMobile: false,
          isReadOnly: true
        })

        expect(screen.queryByLabelText('Edit')).toBeFalsy()
      })

      it('should hide the readOnlyFab when the document is trashed', () => {
        useFetchJSON.mockReturnValue({
          fetchStatus: 'loaded',
          data: officeDocParam
        })
        useQuery.mockReturnValue(officeDocParam)
        isOfficeEditingEnabled.mockReturnValue(true)

        setup({ isMobile: false, isTrashed: true })

        expect(screen.queryByText('Edit')).toBeFalsy()
      })
    })
  })
})
