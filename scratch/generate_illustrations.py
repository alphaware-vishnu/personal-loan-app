import os

project_dir = r'd:\personal-loan-app\personal-loan-app'
svg_dir = os.path.join(project_dir, 'src', 'assets', 'animations', 'illustration')
output_file = os.path.join(project_dir, 'src', 'assets', 'illustrations.ts')

with open(os.path.join(svg_dir, 'undraw_certification_oqiz.svg'), 'r', encoding='utf-8') as f:
    certification_svg = f.read()

with open(os.path.join(svg_dir, 'undraw_data-input_ot3j.svg'), 'r', encoding='utf-8') as f:
    data_input_svg = f.read()

with open(os.path.join(svg_dir, 'undraw_action-successful_e2a7.svg'), 'r', encoding='utf-8') as f:
    action_successful_svg = f.read()

content = f"""// SVG XML Strings for Undraw Illustrations
// These can be rendered in React Native using the SvgXml component from 'react-native-svg'

export const ILLUSTRATIONS = {{
  certification: `{certification_svg}`,
  dataInput: `{data_input_svg}`,
  actionSuccessful: `{action_successful_svg}`
}};
"""

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("illustrations.ts generated successfully!")
