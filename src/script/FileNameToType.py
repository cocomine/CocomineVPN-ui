import os
import json

def generate_file_names_type(dir_path, type_name, output_path):
    """
    Function to get all file names in a directory and convert them to a Python type.
    :param dir_path: The path to the directory.
    :param type_name: The name of the Python type.
    :param output_path: The path to the output Python file.
    """
    # Read all files in the directory
    files = os.listdir(dir_path)

    # Filter out directories and keep only file names
    file_names = [file for file in files if os.path.isfile(os.path.join(dir_path, file))]

    # Convert file names to Python type
    type_content = {type_name: file_names}

    # Write the Python type to the output file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(type_content, f, ensure_ascii=False, indent=4)

# Example usage
directory_path = '../assets/weather alert'
type_name = 'FileNameType'
output_path = './file_names_type.json'

generate_file_names_type(directory_path, type_name, output_path)