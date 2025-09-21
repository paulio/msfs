# Help with MSFS 2024 Avionic Development Tutorial
The [MSFS 2024 Avionic Development Tutorial](https://microsoft.github.io/msfs-avionics-mirror/2024/docs/getting-started/setting-up-your-environment) is a great starting point for learning how to create custom HTML/JS/CSS instruments for Microsoft Flight Simulator 2024 using a React.js mechanism. However, there are some gaps and issues in the official documentation that can make it challenging to follow along. Keep this document open as a companion reference while you work through the official tutorial.


## Setting up Your Environment
[Setting up Your Environment](https://microsoft.github.io/msfs-avionics-mirror/2024/docs/getting-started/setting-up-your-environment) 
After initializing the Typescript project, append & update the values in the default ```tsconfig.json``` rather than simply copying and pasting the provided snippet. 

This is my version
```json
{
  // Visit https://aka.ms/tsconfig to read more about this file
  "compilerOptions": {
    // File Layout
    // "rootDir": "./src",
    
    // Environment Settings
    // See also https://aka.ms/tsconfig/module
    "module": "es2015",
    "target": "es2017",
    "types": [],
    // For nodejs:
    // "lib": ["esnext"],
    // "types": ["node"],
    // and npm install -D @types/node

    // Other Outputs
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,

    // Stricter Typechecking Options
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    // Style Options
    // "noImplicitReturns": true,
    // "noImplicitOverride": true,
    // "noUnusedLocals": true,
    // "noUnusedParameters": true,
    // "noFallthroughCasesInSwitch": true,
    // "noPropertyAccessFromIndexSignature": true,

    // Recommended Options
    "strict": true,
    "jsx": "react",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true,

    "incremental": true, /* Enables incremental builds */
    "esModuleInterop": true, /* Emits additional JS to work with CommonJS modules */
    "forceConsistentCasingInFileNames": true, /* Ensures correct import casing */
    "outDir": "build", /* Sets the output folder to ./build */
    "moduleResolution": "node", /* Enables compatibility with MSFS SDK bare global imports */
    "jsxFactory": "FSComponent.buildComponent", /* Required for FSComponent framework JSX */
    "jsxFragmentFactory": "FSComponent.Fragment", /* Required for FSComponent framework JSX */
  }
}
```

## Creating Your First Component
[Creating Your First Component](https://microsoft.github.io/msfs-avionics-mirror/2024/docs/getting-started/creating-your-first-component)

Before progressing with the tutorial I recommend going back to MSFS and creating an instrument project. You can follow the steps from [Configuring and Building the project](https://github.com/paulio/msfs/blob/main/Tutorials/ReadMe.md#configuring-and-building-the-project) that is taken from the HTML/JS/CSS instrument tutorial. NB Where you see HelloWorldDisplay replace with MyReactInstrument or whatever you want to call your instrument. Also note that original tutorial explains that you need to select the 'Add Package' to initially create the instrument (Custom/Instrument/Copy).

For reference these are my updated panels for replacing the Speed Backup with my new gauge...

```panel.xml```
```xml
...
 <Instrument>
        <Name>MyInstrument</Name>
        <Electric>
            <And>
                <Simvar name="CIRCUIT ON:'SpeedBackup'_n" unit="Boolean" />
            </And>
        </Electric>
    </Instrument>
    ...
```

```panel.cfg```
```ini
[VCockpit02]
size_mm     = 400, 512
pixel_size  = 400, 512
texture     = Speed_Display
htmlgauge00 = MyInstrument/MyInstrument.html, 0, 0, 400, 512
```

Pay attention to the path used. If you're not certain then check after you have built once. Look in the built Packages folder. E.g. ```D:\msfs_dev\DA62\Packages\bourne-myreactinstrument``` and examine the UI output path to find your output files. E.g. ```D:\msfs_dev\DA62\Packages\bourne-myreactinstrument\html_ui\Pages\VCockpit\Instruments\MyInstrument```


Once you have your instrument folder you can continue with the Avionics tutorial.

Correction MyComponent.tsx…

```typescript
import { FSComponent, DisplayComponent, VNode } from '@microsoft/msfs-sdk';

// change to using type' VNode

import { FSComponent, DisplayComponent, type VNode } from '@microsoft/msfs-sdk';
```

Recommend you add a Deploy command to your npm scripts, e.g. (replace myreactinstrument with your path names)

"deploy": "xcopy build\\* \"D:\\msfs_dev\\DA62\\PackageSources\\Copys\\myreactinstrument\\myreactinstrument\" /E /Y /I && copy MyInstrument.html \"D:\\msfs_dev\\DA62\\PackageSources\\Copys\\myreactinstrument\\myreactinstrument\\\" /Y"


On the build step of 'Creating Your First Component' DO NOT attempt to build, you need to complete the next step of Styling Your Component before you can properly deploy it to MSFS. Once you have created the CSS you can then try a deploy.

### What's happening?
The npm build + deploy will bundle the necessary files and deploy them to your aircraft's PackageSources folder. However, you now need to get those files into MSFS. Ensure the dev project is open in MSFS and you can select 'Build All In Project' and test the project, for instructions on testing you can follow [Testing the Gauge](https://github.com/paulio/msfs/blob/main/Tutorials/ReadMe.md#testing-the-gauge)

# What next?
The tutorial is then pretty much error free after that, just be careful to include the module imports and use "type" <module> as when you are prompted by an error. 

I would also recommend moving the text a little more central
```css
.my-component {
  font-size: 40px;
  /* Make the container a flex box so content can be centered */
  display: flex;
  align-items: center;       /* Vertical centering */
  justify-content: center;   /* Horizontal centering */
  text-align: center;        /* Center multi-line text */
  width: 100%;
  height: 100%;              /* Requires parent to have an explicit height */
  box-sizing: border-box;
}
```