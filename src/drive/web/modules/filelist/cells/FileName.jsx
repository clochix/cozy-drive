import React from 'react'
import cx from 'classnames'
import { Link } from 'react-router'

import { TableCell } from 'cozy-ui/transpiled/react/Table'
import MidEllipsis from 'cozy-ui/transpiled/react/MidEllipsis'

import RenameInput from 'drive/web/modules/drive/RenameInput'
import { isDirectory } from 'drive/web/modules/drive/files'
import { CozyFile } from 'models'

import styles from 'drive/styles/filelist.styl'

const FileName = ({
  attributes,
  isRenaming,
  interactive,
  withFilePath,
  isMobile,
  formattedSize,
  formattedUpdatedAt,
  refreshFolderContent,
  isInSyncFromSharing
}) => {
  const classes = cx(
    styles['fil-content-cell'],
    styles['fil-content-file'],
    { [styles['fil-content-file-openable']]: !isRenaming && interactive },
    { [styles['fil-content-row-disabled']]: isInSyncFromSharing }
  )
  const { filename, extension } = CozyFile.splitFilename(attributes)

  return (
    <TableCell className={classes}>
      {isRenaming ? (
        <RenameInput
          file={attributes}
          refreshFolderContent={refreshFolderContent}
        />
      ) : (
        <div className={styles['fil-file']}>
          <div className={styles['fil-file-filename']}>
            <div className={styles['fil-file-filename-wrapper']}>
              <div
                data-test-id="fil-file-filename-and-ext"
                className={styles['fil-file-filename-and-ext']}
              >
                {filename}
                {extension && (
                  <span className={styles['fil-content-ext']}>{extension}</span>
                )}
              </div>
            </div>
          </div>
          {withFilePath &&
            attributes.displayedPath &&
            (isMobile ? (
              <MidEllipsis
                className={styles['fil-file-path']}
                text={attributes.displayedPath}
              />
            ) : (
              <Link
                to={`/folder/${attributes.dir_id}`}
                className={styles['fil-file-path']}
              >
                <MidEllipsis text={attributes.displayedPath} />
              </Link>
            ))}
          {!withFilePath &&
            (isDirectory(attributes) || (
              <div className={styles['fil-file-infos']}>
                {`${formattedUpdatedAt}${
                  formattedSize ? ` - ${formattedSize}` : ''
                }`}
              </div>
            ))}
        </div>
      )}
    </TableCell>
  )
}

export default FileName
