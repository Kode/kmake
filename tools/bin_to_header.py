#!/usr/bin/env python

import sys

def main():
	input_file = open(sys.argv[2], "rb")

	output_file = open(sys.argv[3], "w")
	output_file.write("#include <stdint.h>\n\n")
	output_file.write("const uint8_t " + sys.argv[1] + "[] = {")
	
	while (byte := input_file.read(1)):
		output_file.write("0x")
		output_file.write(byte.hex())
		output_file.write(",")

	input_file.close()

	output_file.write("};\n")
	output_file.close()

if __name__ == "__main__":
	main()
