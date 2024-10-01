import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
declare const WebViewer: any;
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'pdfEditable';
  private viewerInstance: any;
  ngOnInit() {
    this.initWebViewer();
  }


  private initWebViewer() {
    let me = this;
    const viewerElement = document.getElementById('viewer');
    WebViewer({
      path: 'assets/lib',
      initialDoc: 'assets/victimcompensationapp_eng.pdf',
      disabledElements: ['toolbarHeader'] // Hide the default toolbar
    }, viewerElement).then(async instance => {
      const { PDFNet, documentViewer, annotationManager , annotManager  } = instance.Core;

      await PDFNet.initialize();
      this.viewerInstance = instance;


      if (documentViewer) {
        documentViewer.addEventListener('documentLoaded', async () => {
          documentViewer.zoomTo(1.5);
          console.log('Document loaded successfully!');
          // annotationManager.setEdit(false);
          const doc = documentViewer.getDocument();

          // Get the page and modify its content
          const page = await doc.getPage(1); // get page 1 for example
          const contentEditManager = page.getContentEditManager();
      
          // Remove text or watermark that matches specific content
          contentEditManager.getText().forEach(text => {
            if (text.includes('Watermark')) { // Replace with actual logic
              contentEditManager.removeElement(text);
            }
          });
      
          documentViewer.refreshAll();
          documentViewer.updateView();
        });
      } else {
        console.error('Document viewer is not available.');
      }
    }).catch(err => {
      console.error('Error initializing WebViewer:', err);
    });
  }

  setupFieldChangeListener(annotationManager: any) {
    const fieldManager = annotationManager.getFieldManager();

    // Listen for field changes
    annotationManager.addEventListener('formFieldChanged', (field: any) => {
      const fieldName = field.getName();
      const fieldValue = field.getValue();
      
      // Log or handle the field value change
      console.log(`Field "${fieldName}" changed to: ${fieldValue}`);
      
      // Additional logic based on the field value can be added here
    });
  }

  private enableFormFilling(instance: any) {
    const { documentViewer } = instance.Core;

    documentViewer.addEventListener('fieldChange', (fieldName: string, value: any) => {
      debugger
      console.log(`Field ${fieldName} changed to ${value}`);
    });

    // setTimeout(() => {
    //   const fields = documentViewer.getFields();
  
    //   fields.forEach((field: any) => {
    //     field.addEventListener('change', (event: any) => {
    //       console.log(`Field ${field.getName()} changed to ${field.getValue()}`);
    //     });
    //   });
    // }, 1000); // Delay to ensure fields are ready


  }

  async downloadFilledPdf() {
    const { documentViewer, annotationManager } = this.viewerInstance.Core;

    documentViewer.getAnnotationsLoadedPromise().then(() => {
      // iterate over fields
      const fieldManager = annotationManager.getFieldManager();
      fieldManager.forEachField(field => {
        debugger
        console.log(field.getValue());
        // field.setValue('new value');
      });
    });
    const doc = documentViewer.getDocument();
    const xfdfString = await annotationManager.exportAnnotations();
    const data = await doc.getFileData({
      xfdfString
    });
    const arr = new Uint8Array(data);
    const blob = new Blob([arr], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'filled_form.pdf';
    link.click();
  }
}
