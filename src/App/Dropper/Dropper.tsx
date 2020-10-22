import React from 'react';
import styles from './Dropper.module.css'

import { SimpleDropzone } from 'simple-dropzone'
import { Redirect } from 'react-router-dom'
import { IFilePackage } from '../../types';

interface IDropperProps {
  onFileLoad: (filePackage: IFilePackage) => void
}

interface IDropperState {
  isLoaded: boolean
}

/**
 * Adapted from:
 * https://github.com/donmccurdy/three-gltf-viewer
 */
export default class Dropper extends React.Component<IDropperProps, IDropperState> {
  public state: IDropperState = {
    isLoaded: false
  }
  private dropRef = React.createRef<HTMLDivElement>()
  private inputRef = React.createRef<HTMLInputElement>()

  public componentDidMount() {
    if (this.dropRef.current == null || this.inputRef.current == null) throw new Error("Ref's were not ready at mount")
    const dropControl = new SimpleDropzone(this.dropRef.current, this.inputRef.current)
    dropControl.on('drop', ({files}: { files: Map<string,File>}) => this.load(files))
    dropControl.on('dropstart', () => console.log('Starting!'))
    dropControl.on('droperror', () => console.error('Drop Error!'))
  }

  public render() {
    if (this.state.isLoaded) {
      console.log('returning /model redirect')
      return <Redirect to='/model' />
    }

    return (
      <div style={{
        display: 'flex',
        flexGrow: 1,
        height: '100%',
        overflow: 'hidden'
      }}>
        <div className={ styles.dropzone } ref={this.dropRef}>
          <div className={ styles.placeholder }>
            <p>Drag glTF 2.0 file or folder here</p>
          </div>
          <div className={ styles.uploadBtn }>
            <input ref={this.inputRef} type='file' name='file-input[]' id='file-input' multiple />
            <label htmlFor='file-input'>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="17"><path d="M10 0L4.8 4.9h3.3V10h3.8V4.9h3.3L10 0zm9.3 11.5l-3.2-2.1h-2l3.4 2.6H14c-.1 0-.2.1-.2.1l-.8 2.3H7l-.8-2.2c-.1-.1-.1-.2-.2-.2H2.4l3.4-2.6h-2L.6 11.5c-.4.3-.7 1-.6 1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4 1.3-.9L20 13c.1-.5-.2-1.2-.7-1.5z"></path></svg>
              <span>Upload</span>
            </label>
          </div>
        </div>
      </div>
    )
  }

  private load = async (fileMap: Map<string, File>) => {
    let rootFile: File | undefined;
    let rootPath: string | undefined;
    Array.from(fileMap).forEach(([path, file]) => {
      if (file.name.match(/\.(gltf|glb)$/)) {
        rootFile = file;
        rootPath = path.replace(file.name, '');
      }
    });

    if (rootFile == null) {
      this.onError('No .gltf or .glb asset found.');
      return
    }

    await this.props.onFileLoad({rootFile, rootPath, fileMap})
    console.log('setting isLoaded true')
    this.setState({ isLoaded: true }, () => console.log('isLoaded true'))
  }

  private onError (error: any) {
    let message = (error||{}).message || error.toString();
    if (message.match(/ProgressEvent/)) {
      message = 'Unable to retrieve this file. Check JS console and browser network tab.';
    } else if (message.match(/Unexpected token/)) {
      message = `Unable to parse file content. Verify that this file is valid. Error: "${message}"`;
    } else if (error && error.target && error.target instanceof Image) {
      message = 'Missing texture: ' + error.target.src.split('/').pop();
    }
    window.alert(message);
    console.error(error);
  }
}