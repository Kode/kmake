#!/usr/bin/env python

import sys

def main():
	input_file = open(sys.argv[2], "r")
	text = input_file.read()
	input_file.close()

	output_file = open(sys.argv[3], "w")
	output_file.write("const char *" + sys.argv[1] + " = \"")
	output_file.write(text.replace("\n", "\\n").replace("\"", "\\\""))
	output_file.write("\";\n")
	output_file.close()

if __name__ == "__main__":
	main()
