FROM alpine
RUN apk add build-base git python3 linux-headers
ADD . /kmake
WORKDIR "/kmake"
RUN ./configure --openssl-no-asm --without-intl --fully-static
RUN make -j$(nproc)
CMD cp /kmake/out/Release/node /workdir/kmake_linux_x64
