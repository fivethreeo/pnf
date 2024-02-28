# Use an official Python runtime as a parent image
FROM python:3.8-slim as jupyter

# docker build -t jupyter --target jupyter docker/
# docker build -t jupyter_dev --target jupyter_dev docker/
# docker run -d -p 8888:8888 -it -v $(pwd):/usr/src/app/resources jupyter

# Set the working directory in the container
WORKDIR /usr/src/app

# Install OpenCV dependencies, Deno, and clean up in one layer to keep image size down
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1-mesa-glx \
    wget \
    unzip \
    curl \
    tesseract-ocr \
    tesseract-ocr-eng \
 && rm -rf /var/lib/apt/lists/* \
 && curl -fsSL https://deno.land/install.sh | sh

# docker exec id -it bash
# Add Deno to PATH
ENV PATH="/root/.deno/bin:${PATH}"

# Upgrade pip and install required Python packages in one RUN command
RUN pip install --upgrade pip && \
    pip install opencv-python-headless opencv-contrib-python-headless Pillow pytesseract pandas Jupyter mplfinance \
    xlwt openpyxl xlrd matplotlib pypnf

RUN deno upgrade --canary

# Configure Jupyter to use the Deno kernel
RUN deno jupyter --install

# # Download one of the pre-trained super-resolution models from the OpenCV repository
# RUN wget https://github.com/Saafke/EDSR_Tensorflow/raw/master/models/EDSR_x4.pb -O /usr/src/app/EDSR_x4.pb


# Expose port 8888 for Jupyter Notebook
EXPOSE 8888
EXPOSE 9229

WORKDIR /usr/src/app/resources

# Start Jupyter Notebook
CMD ["jupyter", "notebook", "--ip=0.0.0.0", "--no-browser", "--allow-root", "--NotebookApp.token=''", "--NotebookApp.password=''"]

FROM jupyter as jupyter_dev

RUN apt-get update && apt-get install gnupg -y && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg |  apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" |  tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && \
    apt-get install yarn git -y && \
    pip install cookiecutter jupyterlab jupyter-packaging

# docker build -t jupyter_dev --target jupyter_dev .
# docker run -d -p 8888:8888 -it -v $(pwd):/usr/src/app/resources jupyter_dev
# docker exec -it id bash
# cd resources
# cookiecutter https://github.com/Waidhoferj/jupyter-widget-react-cookiecutter.git
# cd widget
# pip install -e ".[test, examples]"
# jupyter labextension develop --overwrite .
# yarn
# yarn add -D @jupyterlab/builder
# yarn run build

